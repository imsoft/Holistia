import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint para forzar la sincronización de un pago específico
 * Útil cuando el webhook no funcionó correctamente
 *
 * Solo accesible para administradores
 */
export async function POST(request: NextRequest) {
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

    // Verificar que sea administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profile?.type !== 'admin') {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { professional_application_id, stripe_session_id } = body;

    if (!professional_application_id && !stripe_session_id) {
      return NextResponse.json(
        { error: "Debes proporcionar professional_application_id o stripe_session_id" },
        { status: 400 }
      );
    }

    console.log('🔵 [Force Sync] Iniciando sincronización forzada...', { professional_application_id, stripe_session_id });

    // 1. Obtener el session_id
    let sessionId = stripe_session_id;
    let applicationId = professional_application_id;

    if (!sessionId) {
      // Buscar la aplicación para obtener el session_id
      const { data: application, error: appError } = await supabase
        .from('professional_applications')
        .select('id, registration_fee_stripe_session_id')
        .eq('id', professional_application_id)
        .single();

      if (appError || !application) {
        return NextResponse.json(
          { error: `Aplicación no encontrada: ${appError?.message}` },
          { status: 404 }
        );
      }

      sessionId = application.registration_fee_stripe_session_id;
      applicationId = application.id;
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "No se encontró un session_id de Stripe para esta aplicación" },
        { status: 400 }
      );
    }

    // 2. Verificar el estado en Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('📊 [Force Sync] Estado en Stripe:', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        message: `El pago no está completado en Stripe. Estado actual: ${session.payment_status}`,
        stripe_status: session.status,
        stripe_payment_status: session.payment_status,
      });
    }

    // 3. Buscar la aplicación completa si no tenemos el ID
    if (!applicationId) {
      const metadata = session.metadata || {};
      applicationId = metadata.professional_application_id;

      if (!applicationId) {
        // Intentar buscar por session_id
        const { data: appBySession } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('registration_fee_stripe_session_id', sessionId)
          .single();

        applicationId = appBySession?.id;
      }

      if (!applicationId) {
        return NextResponse.json(
          { error: "No se pudo encontrar la aplicación asociada a esta sesión" },
          { status: 404 }
        );
      }
    }

    // 4. Actualizar el registro de pago
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Buscar el pago asociado
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('professional_application_id', applicationId)
      .eq('payment_type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (payment) {
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'succeeded',
          paid_at: now.toISOString(),
          payment_method: session.payment_method_types?.[0] || 'card',
          transfer_status: 'completed',
        })
        .eq('id', payment.id);

      if (paymentUpdateError) {
        console.error('❌ [Force Sync] Error al actualizar pago:', paymentUpdateError);
      } else {
        console.log('✅ [Force Sync] Pago actualizado:', payment.id);
      }
    }

    // 5. Actualizar la aplicación profesional
    const { error: applicationUpdateError } = await supabase
      .from('professional_applications')
      .update({
        registration_fee_paid: true,
        registration_fee_paid_at: now.toISOString(),
        registration_fee_expires_at: expiresAt.toISOString(),
      })
      .eq('id', applicationId);

    if (applicationUpdateError) {
      console.error('❌ [Force Sync] Error al actualizar aplicación:', applicationUpdateError);
      return NextResponse.json({
        success: false,
        error: `Error al actualizar la aplicación: ${applicationUpdateError.message}`,
      }, { status: 500 });
    }

    console.log('✅ [Force Sync] Aplicación actualizada:', applicationId);

    return NextResponse.json({
      success: true,
      message: 'Pago sincronizado correctamente',
      professional_application_id: applicationId,
      payment_id: payment?.id,
      registration_fee_paid: true,
      registration_fee_paid_at: now.toISOString(),
      registration_fee_expires_at: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('❌ [Force Sync] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
