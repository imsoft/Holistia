import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint para diagnosticar un pago específico
 * Compara el estado en nuestra BD con el estado en Stripe
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
    const { professional_email, professional_application_id, stripe_session_id } = body;

    console.log('🔍 [Diagnose] Iniciando diagnóstico...', { professional_email, professional_application_id, stripe_session_id });

    const diagnosis: {
      database: {
        professional_application: Record<string, unknown> | null;
        payment: Record<string, unknown> | null;
      };
      stripe: {
        session: Record<string, unknown> | null;
        payment_intent: Record<string, unknown> | null;
      };
      issues: string[];
      recommendations: string[];
    } = {
      database: {
        professional_application: null,
        payment: null,
      },
      stripe: {
        session: null,
        payment_intent: null,
      },
      issues: [],
      recommendations: [],
    };

    // 1. Buscar la aplicación profesional
    let applicationQuery = supabase
      .from('professional_applications')
      .select('*');

    if (professional_application_id) {
      applicationQuery = applicationQuery.eq('id', professional_application_id);
    } else if (professional_email) {
      applicationQuery = applicationQuery.eq('email', professional_email);
    } else if (stripe_session_id) {
      applicationQuery = applicationQuery.eq('registration_fee_stripe_session_id', stripe_session_id);
    } else {
      return NextResponse.json(
        { error: "Debes proporcionar professional_email, professional_application_id, o stripe_session_id" },
        { status: 400 }
      );
    }

    const { data: application, error: appError } = await applicationQuery.single();

    if (appError || !application) {
      diagnosis.issues.push(`No se encontró la aplicación profesional: ${appError?.message || 'No encontrada'}`);
      return NextResponse.json(diagnosis);
    }

    diagnosis.database.professional_application = {
      id: application.id,
      email: application.email,
      first_name: application.first_name,
      last_name: application.last_name,
      status: application.status,
      registration_fee_paid: application.registration_fee_paid,
      registration_fee_paid_at: application.registration_fee_paid_at,
      registration_fee_expires_at: application.registration_fee_expires_at,
      registration_fee_stripe_session_id: application.registration_fee_stripe_session_id,
      registration_fee_payment_id: application.registration_fee_payment_id,
    };

    // 2. Buscar el pago en nuestra BD
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('professional_application_id', application.id)
      .eq('payment_type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (payment) {
      diagnosis.database.payment = {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        stripe_checkout_session_id: payment.stripe_checkout_session_id,
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
      };
    } else {
      diagnosis.issues.push(`No se encontró un pago de registro para esta aplicación: ${paymentError?.message || 'No encontrado'}`);
    }

    // 3. Verificar en Stripe si tenemos un session_id
    const sessionId = stripe_session_id || application.registration_fee_stripe_session_id || payment?.stripe_checkout_session_id;

    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        diagnosis.stripe.session = {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_intent: session.payment_intent,
          created: new Date((session.created || 0) * 1000).toISOString(),
          metadata: session.metadata,
        };

        // Verificar el payment_intent si existe
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          diagnosis.stripe.payment_intent = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            amount_received: paymentIntent.amount_received,
            currency: paymentIntent.currency,
            created: new Date((paymentIntent.created || 0) * 1000).toISOString(),
          };
        }

        // 4. Comparar y detectar problemas
        if (session.payment_status === 'paid' && !application.registration_fee_paid) {
          diagnosis.issues.push('⚠️ PROBLEMA DETECTADO: El pago está completado en Stripe pero NO se refleja en la BD');
          diagnosis.recommendations.push('Ejecutar sincronización manual o verificar que los webhooks de Stripe estén configurados correctamente');
        }

        if (session.payment_status === 'paid' && payment?.status !== 'succeeded') {
          diagnosis.issues.push('⚠️ PROBLEMA DETECTADO: El pago está completado en Stripe pero el registro de pago tiene status: ' + (payment?.status || 'N/A'));
          diagnosis.recommendations.push('El webhook no actualizó correctamente el registro de pago');
        }

        if (session.payment_status === 'unpaid') {
          diagnosis.issues.push('ℹ️ La sesión de checkout no ha sido pagada todavía');
        }

        if (session.status === 'expired') {
          diagnosis.issues.push('ℹ️ La sesión de checkout ha expirado (el usuario no completó el pago)');
          diagnosis.recommendations.push('El profesional debe intentar pagar nuevamente');
        }

      } catch (stripeError) {
        diagnosis.issues.push(`Error al consultar Stripe: ${stripeError instanceof Error ? stripeError.message : 'Error desconocido'}`);
      }
    } else {
      diagnosis.issues.push('No hay session_id de Stripe para verificar');
    }

    // 5. Verificar si hay webhooks funcionando (basado en si tenemos payment_intent_id)
    if (payment && payment.stripe_checkout_session_id && !payment.stripe_payment_intent_id) {
      diagnosis.issues.push('⚠️ El pago tiene session_id pero NO tiene payment_intent_id - posible problema con webhooks');
      diagnosis.recommendations.push('Verificar que el endpoint de webhook esté configurado en Stripe Dashboard: https://dashboard.stripe.com/webhooks');
      diagnosis.recommendations.push('Verificar que STRIPE_WEBHOOK_SECRET esté correctamente configurado en las variables de entorno de Vercel');
    }

    // 6. Resumen final
    if (diagnosis.issues.length === 0) {
      diagnosis.issues.push('✅ No se detectaron problemas - todo parece estar correctamente sincronizado');
    }

    console.log('✅ [Diagnose] Diagnóstico completado');
    return NextResponse.json(diagnosis);

  } catch (error) {
    console.error('❌ [Diagnose] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET para listar todos los pagos de inscripción pendientes con problemas
 */
export async function GET(request: NextRequest) {
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

    // Buscar aplicaciones con session_id pero sin pago confirmado
    const { data: applications, error: appsError } = await supabase
      .from('professional_applications')
      .select(`
        id,
        email,
        first_name,
        last_name,
        status,
        registration_fee_paid,
        registration_fee_paid_at,
        registration_fee_stripe_session_id,
        registration_fee_payment_id,
        created_at
      `)
      .not('registration_fee_stripe_session_id', 'is', null)
      .eq('registration_fee_paid', false)
      .order('created_at', { ascending: false });

    if (appsError) {
      return NextResponse.json(
        { error: `Error al buscar aplicaciones: ${appsError.message}` },
        { status: 500 }
      );
    }

    // Para cada aplicación, verificar el estado en Stripe
    const applicationsWithStripeStatus = await Promise.all(
      (applications || []).map(async (app) => {
        let stripeStatus = 'unknown';
        let stripePaymentStatus = 'unknown';

        if (app.registration_fee_stripe_session_id) {
          try {
            const session = await stripe.checkout.sessions.retrieve(app.registration_fee_stripe_session_id);
            stripeStatus = session.status || 'unknown';
            stripePaymentStatus = session.payment_status || 'unknown';
          } catch {
            stripeStatus = 'error_fetching';
          }
        }

        return {
          ...app,
          stripe_session_status: stripeStatus,
          stripe_payment_status: stripePaymentStatus,
          needs_sync: stripePaymentStatus === 'paid',
        };
      })
    );

    return NextResponse.json({
      total: applicationsWithStripeStatus.length,
      needs_sync: applicationsWithStripeStatus.filter(a => a.needs_sync).length,
      applications: applicationsWithStripeStatus,
    });

  } catch (error) {
    console.error('❌ [Diagnose] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
