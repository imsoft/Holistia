import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint para sincronizar manualmente los pagos de inscripción con Stripe
 * Este endpoint verifica todos los pagos pendientes y actualiza su estado consultando a Stripe
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

    console.log('🔵 [Sync] Iniciando sincronización de pagos de inscripción...');

    // Obtener todos los pagos de inscripción pendientes que tienen session_id
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, stripe_checkout_session_id, professional_application_id')
      .eq('payment_type', 'registration')
      .eq('status', 'pending')
      .not('stripe_checkout_session_id', 'is', null);

    if (paymentsError) {
      console.error('❌ Error al obtener pagos:', paymentsError);
      return NextResponse.json(
        { error: "Error al obtener pagos pendientes" },
        { status: 500 }
      );
    }

    console.log(`📊 Encontrados ${pendingPayments?.length || 0} pagos pendientes`);

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({
        message: "No hay pagos pendientes para sincronizar",
        synced: 0
      });
    }

    const results = {
      synced: 0,
      failed: 0,
      details: [] as Array<{ payment_id: string; session_id: string; status: string; message: string }>
    };

    // Verificar cada pago en Stripe
    for (const payment of pendingPayments) {
      try {
        console.log(`🔍 Verificando sesión: ${payment.stripe_checkout_session_id}`);

        // Obtener la sesión de Stripe
        const session = await stripe.checkout.sessions.retrieve(
          payment.stripe_checkout_session_id
        );

        console.log(`   Estado: ${session.payment_status}, Payment Intent: ${session.payment_intent}`);

        // Si el pago fue exitoso, actualizar la base de datos
        if (session.payment_status === 'paid') {
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Expira en 1 año

          // Actualizar el pago
          const { error: paymentUpdateError } = await supabase
            .from('payments')
            .update({
              stripe_payment_intent_id: session.payment_intent as string,
              status: 'succeeded',
              paid_at: now.toISOString(),
              payment_method: session.payment_method_types?.[0] || null,
              transfer_status: 'completed',
            })
            .eq('id', payment.id);

          if (paymentUpdateError) {
            console.error(`❌ Error al actualizar pago ${payment.id}:`, paymentUpdateError);
            results.failed++;
            results.details.push({
              payment_id: payment.id,
              session_id: payment.stripe_checkout_session_id,
              status: 'error',
              message: `Error al actualizar pago: ${paymentUpdateError.message}`
            });
            continue;
          }

          // Actualizar la aplicación profesional
          const { error: applicationUpdateError } = await supabase
            .from('professional_applications')
            .update({
              registration_fee_paid: true,
              registration_fee_paid_at: now.toISOString(),
              registration_fee_expires_at: expiresAt.toISOString(),
            })
            .eq('id', payment.professional_application_id);

          if (applicationUpdateError) {
            console.error(`❌ Error al actualizar aplicación ${payment.professional_application_id}:`, applicationUpdateError);
            results.failed++;
            results.details.push({
              payment_id: payment.id,
              session_id: payment.stripe_checkout_session_id,
              status: 'error',
              message: `Error al actualizar aplicación: ${applicationUpdateError.message}`
            });
            continue;
          }

          console.log(`✅ Pago ${payment.id} sincronizado exitosamente`);
          results.synced++;
          results.details.push({
            payment_id: payment.id,
            session_id: payment.stripe_checkout_session_id,
            status: 'synced',
            message: `Pago sincronizado. Expira el ${expiresAt.toLocaleDateString('es-ES')}`
          });
        } else {
          console.log(`⏳ Sesión ${payment.stripe_checkout_session_id} no está pagada (${session.payment_status})`);
          results.details.push({
            payment_id: payment.id,
            session_id: payment.stripe_checkout_session_id,
            status: 'not_paid',
            message: `Estado en Stripe: ${session.payment_status}`
          });
        }
      } catch (error) {
        console.error(`❌ Error al verificar pago ${payment.id}:`, error);
        results.failed++;
        results.details.push({
          payment_id: payment.id,
          session_id: payment.stripe_checkout_session_id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    console.log(`✅ Sincronización completada: ${results.synced} exitosos, ${results.failed} fallidos`);

    return NextResponse.json({
      message: "Sincronización completada",
      synced: results.synced,
      failed: results.failed,
      total: pendingPayments.length,
      details: results.details
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
