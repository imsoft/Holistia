import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateCommission, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting checkout session creation...');
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
      appointment_id, 
      service_amount, 
      professional_id, 
      description,
      // Nuevos campos para crear la cita
      appointment_date,
      appointment_time,
      appointment_type,
      notes
    } = body;

    // Validate required fields
    if (!service_amount || !professional_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Si no hay appointment_id, necesitamos los datos para crear la cita
    if (!appointment_id && (!appointment_date || !appointment_time || !appointment_type)) {
      return NextResponse.json(
        { error: 'Faltan datos de la cita para crear la reserva' },
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

    let appointmentId = appointment_id;
    
    // Si no hay appointment_id, crear la cita primero
    if (!appointmentId) {
      console.log('🔄 Creating new appointment...');
      
      // Determinar ubicación basada en el tipo de cita
      const { data: professionalData } = await supabase
        .from('professional_applications')
        .select('address, city, state')
        .eq('id', professional_id)
        .single();
      
      const location = appointment_type === 'online' 
        ? 'Consulta en línea' 
        : professionalData?.address || 'Por definir';
      
      console.log('📍 Location determined:', location);
      
      // Crear la cita
      const appointmentData = {
        patient_id: user.id,
        professional_id: professional_id,
        appointment_date: appointment_date,
        appointment_time: appointment_time,
        duration_minutes: 50,
        appointment_type: appointment_type,
        status: 'pending',
        cost: service_amount,
        location: location,
        notes: notes || null
      };
      
      console.log('💾 Inserting appointment:', appointmentData);
      
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (createError || !newAppointment) {
        console.error('❌ Error creating appointment:', createError);
        return NextResponse.json(
          { error: `Error al crear la cita: ${createError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
      
      console.log('✅ Appointment created:', newAppointment.id);
      appointmentId = newAppointment.id;
    }

    // Check if appointment already has a payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('status', 'succeeded')
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Esta cita ya tiene un pago confirmado' },
        { status: 400 }
      );
    }

    // Get professional information
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('first_name, last_name, profession')
      .eq('id', professional_id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Calculate commission (15%)
    const commissionAmount = calculateCommission(service_amount, 15);

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        service_amount,
        amount: commissionAmount,
        commission_percentage: 15,
        currency: 'mxn',
        status: 'pending',
        patient_id: user.id,
        professional_id,
        description: description || `Reserva de consulta con ${professional.first_name} ${professional.last_name}`,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json(
        { error: 'Error al crear registro de pago' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            unit_amount: formatAmountForStripe(commissionAmount),
            product_data: {
              name: 'Reserva de Consulta - Holistia',
              description: `${professional.profession}: ${professional.first_name} ${professional.last_name}`,
              images: ['https://via.placeholder.com/300x200?text=Holistia'], // Replace with your logo
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointment_id: appointmentId,
        payment_id: payment.id,
        patient_id: user.id,
        professional_id,
        service_amount: service_amount.toString(),
        commission_amount: commissionAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/explore/appointments?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/patient/${user.id}/explore/appointments?payment=cancelled`,
      customer_email: user.email,
    });

    // Update payment record with Stripe session ID
    await supabase
      .from('payments')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
        status: 'processing',
      })
      .eq('id', payment.id);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Error al crear sesión de pago',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

