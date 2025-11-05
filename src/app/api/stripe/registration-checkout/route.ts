import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { professional_application_id } = await request.json();

    if (!professional_application_id) {
      return NextResponse.json(
        { error: "Falta el ID de la aplicación profesional" },
        { status: 400 }
      );
    }

    // Verificar que la aplicación existe y pertenece al usuario
    const { data: application, error: appError } = await supabase
      .from("professional_applications")
      .select("*")
      .eq("id", professional_application_id)
      .eq("user_id", user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya pagó
    if (application.registration_fee_paid) {
      return NextResponse.json(
        { error: "La cuota de inscripción ya fue pagada" },
        { status: 400 }
      );
    }

    const registrationFeeAmount = application.registration_fee_amount || 600.00;
    const currency = application.registration_fee_currency || "mxn";

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

    if (paymentError || !payment) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json(
        { error: "Error al crear el registro de pago" },
        { status: 500 }
      );
    }

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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/patient/${user.id}/explore/become-professional?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/patient/${user.id}/explore/become-professional?payment=cancelled`,
      client_reference_id: professional_application_id,
      metadata: {
        payment_id: payment.id,
        payment_type: "registration",
        professional_application_id: professional_application_id,
        user_id: user.id,
      },
    });

    // Actualizar el pago con el session_id
    await supabase
      .from("payments")
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq("id", payment.id);

    // Actualizar la aplicación con el session_id
    await supabase
      .from("professional_applications")
      .update({
        registration_fee_stripe_session_id: session.id,
        registration_fee_payment_id: payment.id,
      })
      .eq("id", professional_application_id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating registration checkout session:", error);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago" },
      { status: 500 }
    );
  }
}

