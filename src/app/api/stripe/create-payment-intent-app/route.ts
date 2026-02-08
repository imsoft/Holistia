import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, calculateCommission, calculateTransferAmount, formatAmountForStripe } from '@/lib/stripe';

/**
 * Crea un PaymentIntent para pagar una cita desde la app móvil.
 * La app envía el token de Supabase en Authorization y el appointment_id en el body.
 * Devuelve client_secret para usar con Stripe Payment Sheet en React Native.
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
    const { appointment_id: appointmentId } = body;
    if (!appointmentId) {
      return NextResponse.json({ error: 'Falta appointment_id' }, { status: 400 });
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, patient_id, professional_id, cost, status')
      .eq('id', appointmentId)
      .eq('patient_id', user.id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('status', 'succeeded')
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ error: 'Esta cita ya tiene un pago confirmado' }, { status: 400 });
    }

    const serviceAmount = Number(appointment.cost);
    if (!serviceAmount || serviceAmount <= 0) {
      return NextResponse.json({ error: 'Monto de la cita inválido' }, { status: 400 });
    }

    const professionalId = appointment.professional_id;

    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id, first_name, last_name, profession, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', professionalId)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 });
    }

    if (!professional.stripe_account_id) {
      return NextResponse.json(
        { error: 'El profesional aún no ha configurado su cuenta de pagos. Por favor, contacta al profesional o intenta con otro experto.', code: 'STRIPE_NOT_CONFIGURED' },
        { status: 400 }
      );
    }

    if (!professional.stripe_charges_enabled || !professional.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: 'La cuenta de pagos del profesional está en proceso de configuración. Por favor, intenta más tarde o contacta al profesional.', code: 'STRIPE_INCOMPLETE' },
        { status: 400 }
      );
    }

    const platformFee = calculateCommission(serviceAmount, 15);
    const transferAmount = calculateTransferAmount(serviceAmount, 15);

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        service_amount: serviceAmount,
        amount: serviceAmount,
        commission_percentage: 15,
        platform_fee: platformFee,
        transfer_amount: transferAmount,
        currency: 'mxn',
        status: 'pending',
        patient_id: user.id,
        professional_id: professionalId,
        description: `Reserva de consulta con ${professional.first_name} ${professional.last_name}`,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json({ error: 'Error al crear registro de pago' }, { status: 500 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(serviceAmount),
      currency: 'mxn',
      payment_method_types: ['card'],
      application_fee_amount: formatAmountForStripe(platformFee),
      transfer_data: {
        destination: professional.stripe_account_id,
      },
      metadata: {
        appointment_id: appointmentId,
        payment_id: payment.id,
        patient_id: user.id,
        professional_id: professionalId,
        source: 'app',
      },
      receipt_email: user.email ?? undefined,
    });

    await supabase
      .from('payments')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: 'processing',
      })
      .eq('id', payment.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error creating payment intent for app:', error);
    return NextResponse.json(
      { error: 'Error al crear intención de pago', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
