import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';

/**
 * Crea un PaymentIntent para pagar un evento desde la app móvil.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { event_id, service_amount } = body;
    if (!event_id || !service_amount) {
      return NextResponse.json({ error: 'Faltan event_id o service_amount' }, { status: 400 });
    }

    const { data: event, error: eventError } = await supabase
      .from('events_workshops')
      .select('*, professional_applications!inner(id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, first_name, last_name)')
      .eq('id', event_id)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const organizer = Array.isArray(event.professional_applications)
      ? event.professional_applications[0]
      : event.professional_applications;

    if (!organizer?.stripe_account_id || !organizer.stripe_charges_enabled || !organizer.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'El organizador no tiene configurado el sistema de pagos', code: 'STRIPE_NOT_CONFIGURED' },
        { status: 400 }
      );
    }

    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .maybeSingle();

    let registrationId = existingRegistration?.id;
    if (!registrationId) {
      const { data: newReg, error: regError } = await supabase
        .from('event_registrations')
        .insert({ event_id, user_id: user.id, status: 'pending' })
        .select('id')
        .single();
      if (regError || !newReg) {
        return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 });
      }
      registrationId = newReg.id;
    }

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('event_registration_id', registrationId)
      .eq('status', 'succeeded')
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ error: 'Ya tienes un pago confirmado para este evento' }, { status: 400 });
    }

    const platformFee = calculateCommission(service_amount, 20);
    const transferAmount = calculateTransferAmount(service_amount, 20);

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        event_id,
        event_registration_id: registrationId,
        payment_type: 'event',
        service_amount,
        amount: service_amount,
        commission_percentage: 20,
        platform_fee: platformFee,
        transfer_amount: transferAmount,
        currency: 'mxn',
        status: 'pending',
        patient_id: user.id,
        professional_id: event.professional_id,
        description: `Registro al evento: ${event.name}`,
      })
      .select('id')
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Error al crear registro de pago' }, { status: 500 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(service_amount),
      currency: 'mxn',
      payment_method_types: ['card'],
      application_fee_amount: formatAmountForStripe(platformFee),
      transfer_data: { destination: organizer.stripe_account_id },
      metadata: {
        event_id,
        event_registration_id: registrationId,
        payment_id: payment.id,
        user_id: user.id,
        source: 'app',
      },
      receipt_email: user.email ?? undefined,
    });

    await supabase
      .from('payments')
      .update({ stripe_payment_intent_id: paymentIntent.id, status: 'processing' })
      .eq('id', payment.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error creating payment intent for event:', error);
    return NextResponse.json(
      { error: 'Error al crear intención de pago', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
