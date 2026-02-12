import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { formatDate } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting event checkout session creation...');
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { 
      event_id, 
      service_amount,
      notes,
      emergency_contact_name,
      emergency_contact_phone,
      special_requirements
    } = body;

    // Validate required fields
    if (!event_id || !service_amount) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validate service amount
    if (typeof service_amount !== 'number' || service_amount <= 0) {
      return NextResponse.json(
        { error: 'Monto de servicio inválido' },
        { status: 400 }
      );
    }

    // Check if event exists and is active, include Stripe Connect info
    const { data: event, error: eventError } = await supabase
      .from('events_workshops')
      .select('*, professional_applications!inner(stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, first_name, last_name)')
      .eq('id', event_id)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado o no disponible' },
        { status: 404 }
      );
    }

    // Check if event organizer has Stripe Connect enabled
    const organizer = Array.isArray(event.professional_applications) 
      ? event.professional_applications[0] 
      : event.professional_applications;

    if (!organizer?.stripe_account_id) {
      return NextResponse.json(
        { error: 'El organizador del evento aún no ha configurado su cuenta de pagos' },
        { status: 400 }
      );
    }

    if (!organizer.stripe_charges_enabled || !organizer.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'La cuenta de pagos del organizador no está completamente configurada' },
        { status: 400 }
      );
    }

    // Check if user already has a registration for this event
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .single();

    if (existingRegistration && existingRegistration.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Ya tienes una reserva confirmada para este evento' },
        { status: 400 }
      );
    }

    // Check if there's already a successful payment for this event
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('patient_id', user.id)
      .single();

    if (existingPayment && existingPayment.status === 'succeeded') {
      return NextResponse.json(
        { error: 'Ya tienes un pago confirmado para este evento' },
        { status: 400 }
      );
    }

    // Use existing registration or create new one
    let registration;
    if (existingRegistration) {
      registration = existingRegistration;
    } else {
      const { data: newRegistration, error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          event_id,
          user_id: user.id,
          status: 'pending',
          notes,
          emergency_contact_name,
          emergency_contact_phone,
          special_requirements
        })
        .select()
        .single();

      if (registrationError || !newRegistration) {
        console.error('Error creating event registration:', registrationError);
        return NextResponse.json(
          { error: 'Error al crear registro del evento' },
          { status: 500 }
        );
      }
      registration = newRegistration;
    }

    // Calculate commission (20% for events) and transfer amount
    const platformFee = calculateCommission(service_amount, 20);
    const transferAmount = calculateTransferAmount(service_amount, 20);

    // Use existing payment or create new one
    let payment;
    if (existingPayment) {
      payment = existingPayment;
    } else {
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          event_id,
          event_registration_id: registration.id,
          payment_type: 'event',
          service_amount,
          amount: service_amount, // Total amount charged to customer
          commission_percentage: 20,
          platform_fee: platformFee, // Platform commission (20%)
          transfer_amount: transferAmount, // Amount to be transferred to organizer
          currency: 'mxn',
          status: 'pending',
          patient_id: user.id,
          professional_id: event.professional_id,
          description: `Registro al evento: ${event.name}`,
        })
        .select()
        .single();

      if (paymentError || !newPayment) {
        console.error('Error creating payment record:', paymentError);
        return NextResponse.json(
          { error: 'Error al crear registro de pago' },
          { status: 500 }
        );
      }
      payment = newPayment;
    }

    // Create Stripe Checkout Session with Connect (platform charges, transfers to organizer)
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Registro al evento: ${event.name}`,
              description: `Reserva para el evento del ${formatDate(event.event_date, 'es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            },
            unit_amount: formatAmountForStripe(service_amount), // Charge full amount to customer
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: formatAmountForStripe(platformFee), // Platform takes 20%
        transfer_data: {
          destination: organizer.stripe_account_id, // Transfer rest to organizer
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/patient/${user.id}/explore/event/${event_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/patient/${user.id}/explore/event/${event_id}`,
      metadata: {
        payment_id: payment.id,
        event_id: event_id,
        event_registration_id: registration.id,
        user_id: user.id,
        platform_fee: platformFee.toString(),
        transfer_amount: transferAmount.toString(),
      },
      customer_email: user.email,
    });

    // Update payment record with Stripe session ID
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment with session ID:', updateError);
    }

    console.log('✅ Event checkout session created successfully:', checkoutSession.id);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('❌ Error creating event checkout session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
