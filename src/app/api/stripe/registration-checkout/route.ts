import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(request: Request) {
  try {
    console.log('🔵 [Registration Checkout] Iniciando proceso de pago');

    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [Registration Checkout] Error de autenticación:', authError);
      return NextResponse.json(
        { error: "No autorizado. Por favor, inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    console.log('✅ [Registration Checkout] Usuario autenticado:', user.id);

    const { professional_application_id } = await request.json();

    if (!professional_application_id) {
      console.error('❌ [Registration Checkout] Falta ID de aplicación');
      return NextResponse.json(
        { error: "Falta el ID de la aplicación profesional" },
        { status: 400 }
      );
    }

    console.log('🔵 [Registration Checkout] Buscando aplicación:', professional_application_id);

    // Verificar que la aplicación existe y pertenece al usuario
    const { data: application, error: appError } = await supabase
      .from("professional_applications")
      .select("*")
      .eq("id", professional_application_id)
      .eq("user_id", user.id)
      .single();

    if (appError) {
      console.error('❌ [Registration Checkout] Error al buscar aplicación:', appError);
      return NextResponse.json(
        { error: "Error al buscar la aplicación profesional. Contacta a soporte." },
        { status: 500 }
      );
    }

    if (!application) {
      console.error('❌ [Registration Checkout] Aplicación no encontrada');
      return NextResponse.json(
        { error: "Aplicación no encontrada. Verifica que hayas completado el proceso de registro." },
        { status: 404 }
      );
    }

    console.log('✅ [Registration Checkout] Aplicación encontrada:', {
      id: application.id,
      status: application.status,
      fee_paid: application.registration_fee_paid,
      fee_expires_at: application.registration_fee_expires_at
    });

    // Verificar si ya pagó y la inscripción está activa
    if (application.registration_fee_paid && application.registration_fee_expires_at) {
      const expiresAt = new Date(application.registration_fee_expires_at);
      const now = new Date();

      if (expiresAt > now) {
        console.log('⚠️ [Registration Checkout] Inscripción ya está activa');
        return NextResponse.json(
          { error: "Tu inscripción ya está activa y no ha expirado aún." },
          { status: 400 }
        );
      }
    }

    const registrationFeeAmount = application.registration_fee_amount || 600.00;
    const currency = application.registration_fee_currency || "mxn";

    console.log('🔵 [Registration Checkout] Creando pago:', {
      amount: registrationFeeAmount,
      currency
    });

    // Convertir a centavos para Stripe
    const amountInCents = Math.round(registrationFeeAmount * 100);

    // Crear registro de pago en la base de datos
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        payment_type: "registration",
        amount: registrationFeeAmount, // Guardar en pesos, no en centavos
        service_amount: registrationFeeAmount, // Guardar en pesos, no en centavos
        commission_percentage: 100, // 100% va a la plataforma
        currency: currency,
        status: "pending",
        patient_id: user.id,
        professional_application_id: professional_application_id,
        description: `Cuota de inscripción profesional - ${application.first_name} ${application.last_name}`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ [Registration Checkout] Error al crear registro de pago:', paymentError);
      return NextResponse.json(
        { error: `Error al crear el registro de pago: ${paymentError.message}` },
        { status: 500 }
      );
    }

    if (!payment) {
      console.error('❌ [Registration Checkout] No se creó el registro de pago');
      return NextResponse.json(
        { error: "No se pudo crear el registro de pago" },
        { status: 500 }
      );
    }

    console.log('✅ [Registration Checkout] Pago creado:', payment.id);
    console.log('🔵 [Registration Checkout] Creando sesión de Stripe Checkout');

    // Asegurar que la URL base tenga el esquema correcto
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io';
    const successUrl = `${baseUrl}/patient/${user.id}/explore/become-professional?payment=success`;
    const cancelUrl = `${baseUrl}/patient/${user.id}/explore/become-professional?payment=cancelled`;

    console.log('🔵 [Registration Checkout] URLs:', { successUrl, cancelUrl });

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "Cuota de Inscripción Profesional",
              description: `Cuota de inscripción para ${application.first_name} ${application.last_name}`,
              images: ["https://holistia.mx/logos/holistia-black.png"],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: professional_application_id,
      metadata: {
        payment_id: payment.id,
        payment_type: "registration",
        professional_application_id: professional_application_id,
        user_id: user.id,
      },
    });

    console.log('✅ [Registration Checkout] Sesión de Stripe creada:', session.id);

    // Actualizar el pago con el session_id
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error('⚠️ [Registration Checkout] Error al actualizar pago:', updatePaymentError);
    }

    // Actualizar la aplicación con el session_id
    const { error: updateAppError } = await supabase
      .from("professional_applications")
      .update({
        registration_fee_stripe_session_id: session.id,
        registration_fee_payment_id: payment.id,
      })
      .eq("id", professional_application_id);

    if (updateAppError) {
      console.error('⚠️ [Registration Checkout] Error al actualizar aplicación:', updateAppError);
    }

    console.log('✅ [Registration Checkout] Proceso completado. URL:', session.url);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ [Registration Checkout] Error inesperado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al crear la sesión de pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}

