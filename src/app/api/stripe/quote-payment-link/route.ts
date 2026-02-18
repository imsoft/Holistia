import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { stripe, formatAmountForStripe, calculateCommission, calculateTransferAmount } from '@/lib/stripe';

/**
 * POST /api/stripe/quote-payment-link
 * Crea un enlace de pago de Stripe para un servicio con cotización
 * 
 * Body:
 * - service_id: ID del servicio
 * - amount: Monto acordado (en MXN)
 * - conversation_id: ID de la conversación donde se está negociando
 * - patient_id: ID del paciente que pagará
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { service_id, amount, conversation_id, patient_id } = body;

    // Validar campos requeridos
    if (!service_id || !amount || !conversation_id || !patient_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: service_id, amount, conversation_id, patient_id' },
        { status: 400 }
      );
    }

    // Asegurar que service_id sea string (por si viene como número u otro tipo)
    const serviceIdStr = String(service_id).trim();
    if (!serviceIdStr || serviceIdStr.length < 30) {
      return NextResponse.json(
        { error: 'ID de servicio inválido' },
        { status: 400 }
      );
    }

    // Validar que el monto sea positivo
    const serviceAmount = parseFloat(amount);
    if (isNaN(serviceAmount) || serviceAmount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número positivo' },
        { status: 400 }
      );
    }

    // Obtener el servicio (sin join para evitar fallos por RLS en la relación)
    const { data: service, error: serviceError } = await supabase
      .from('professional_services')
      .select('id, name, description, pricing_type, image_url, professional_id, user_id')
      .eq('id', serviceIdStr)
      .single();

    if (serviceError || !service) {
      console.error('Quote payment link: servicio no encontrado', { service_id, error: serviceError?.message, code: serviceError?.code });
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el servicio es de tipo quote
    if (service.pricing_type !== 'quote') {
      return NextResponse.json(
        { error: 'Este servicio no es de tipo cotización' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el dueño (professional_services tiene user_id)
    if (service.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear enlaces de pago para este servicio' },
        { status: 403 }
      );
    }

    // Obtener datos del profesional para Stripe Connect
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id, user_id, first_name, last_name, stripe_account_id, status')
      .eq('id', service.professional_id)
      .single();

    if (professionalError || !professional) {
      console.error('Quote payment link: profesional no encontrado', { professional_id: service.professional_id, error: professionalError?.message });
      return NextResponse.json(
        { error: 'Datos del profesional no encontrados' },
        { status: 404 }
      );
    }

    // Verificar que el profesional tiene cuenta de Stripe Connect
    if (!professional.stripe_account_id) {
      return NextResponse.json(
        { error: 'El profesional no tiene una cuenta de Stripe Connect configurada' },
        { status: 400 }
      );
    }

    // Verificar que el profesional está aprobado
    if (professional.status !== 'approved') {
      return NextResponse.json(
        { error: 'El profesional no está aprobado' },
        { status: 400 }
      );
    }

    // Obtener información del usuario que pagará (paciente u otro tipo); usar service role para no depender de RLS
    const supabaseAdmin = createServiceRoleClient();
    const { data: payer, error: payerError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', patient_id)
      .single();

    if (payerError || !payer) {
      return NextResponse.json(
        { error: 'Usuario no encontrado. No se pudo obtener el perfil de quien pagará.' },
        { status: 404 }
      );
    }

    // Calcular comisiones (15% para Holistia, 85% para el profesional)
    const platformFee = calculateCommission(serviceAmount, 15);
    const transferAmount = calculateTransferAmount(serviceAmount, 15);

    // Crear registro de pago con service role (supabaseAdmin ya creado arriba para buscar al pagador)
    const paymentRow = {
      patient_id: patient_id,
      professional_id: professional.id,
      professional_application_id: professional.id,
      amount: serviceAmount,
      service_amount: serviceAmount,
      currency: 'mxn',
      status: 'pending',
      payment_type: 'quote_service' as const,
      commission_percentage: 15.00,
      description: `Cotización: ${service.name}`,
      appointment_id: null as string | null,
      event_id: null as string | null,
      metadata: {
        service_id: serviceIdStr,
        service_name: service.name,
        conversation_id: conversation_id,
        pricing_type: 'quote',
        platform_fee: platformFee,
        transfer_amount: transferAmount,
      },
    };

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert(paymentRow)
      .select()
      .single();

    if (paymentError || !payment) {
      const errMessage = paymentError?.message ?? 'Unknown error';
      const errCode = paymentError?.code ?? '';
      const errDetails = paymentError?.details ?? '';
      console.error('Error creating quote payment record:', {
        message: errMessage,
        code: errCode,
        details: errDetails,
        hint: paymentError?.hint,
      });
      const isDev = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        {
          error: 'Error al crear el registro de pago',
          ...(isDev && { debug: errMessage, code: errCode }),
        },
        { status: 500 }
      );
    }

    // Crear sesión de Stripe Checkout con Connect
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            unit_amount: formatAmountForStripe(serviceAmount),
            product_data: {
              name: `Cotización: ${service.name}`,
              description: service.description 
                ? service.description.substring(0, 500).replace(/<[^>]*>/g, '')
                : `Servicio de ${professional.first_name} ${professional.last_name}`,
              images: service.image_url ? [service.image_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // Holistia recibe el 15% como comisión de plataforma
        application_fee_amount: formatAmountForStripe(platformFee),
        transfer_data: {
          // El profesional recibe el 85% restante
          destination: professional.stripe_account_id,
        },
      },
      metadata: {
        payment_id: payment.id,
        service_id: service_id,
        conversation_id: conversation_id,
        patient_id: patient_id,
        professional_id: professional.id,
        payment_type: 'quote_service',
        platform_fee: platformFee.toString(),
        transfer_amount: transferAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/messages?conversation=${conversation_id}&payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/messages?conversation=${conversation_id}&payment=cancelled`,
      customer_email: payer.email || undefined,
    });

    // Actualizar el registro de pago con el session_id (mismo cliente admin)
    await supabaseAdmin
      .from('payments')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
        status: 'processing',
      })
      .eq('id', payment.id);

    console.log('✅ Quote payment link created successfully:', {
      payment_id: payment.id,
      session_id: checkoutSession.id,
      amount: serviceAmount,
      platform_fee: platformFee,
      transfer_amount: transferAmount,
    });

    return NextResponse.json({
      payment_id: payment.id,
      session_id: checkoutSession.id,
      url: checkoutSession.url,
      amount: serviceAmount,
      platform_fee: platformFee,
      transfer_amount: transferAmount,
    });

  } catch (error) {
    console.error('❌ Error creating quote payment link:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
