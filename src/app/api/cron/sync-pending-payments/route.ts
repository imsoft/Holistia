import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * Cron job para sincronizar automáticamente pagos pendientes
 * Se ejecuta cada hora para verificar pagos que deberían estar completados
 *
 * Configurar en Vercel Cron:
 * - Schedule: 0 * * * * (cada hora)
 * - Path: /api/cron/sync-pending-payments
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que la petición venga de Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🔄 [Cron] Iniciando sincronización automática de pagos...');

    const supabase = await createClient();

    // Obtener pagos pendientes de inscripción de las últimas 48 horas
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, stripe_checkout_session_id, professional_application_id, created_at')
      .eq('payment_type', 'registration')
      .eq('status', 'pending')
      .not('stripe_checkout_session_id', 'is', null)
      .gte('created_at', twoDaysAgo.toISOString());

    if (paymentsError) {
      console.error('❌ Error al obtener pagos:', paymentsError);
      return NextResponse.json(
        { error: 'Error al obtener pagos pendientes' },
        { status: 500 }
      );
    }

    console.log(`📊 Encontrados ${pendingPayments?.length || 0} pagos pendientes recientes`);

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({
        message: "No hay pagos pendientes para sincronizar",
        synced: 0,
        checked: 0,
      });
    }

    const results = {
      synced: 0,
      failed: 0,
      notPaid: 0,
    };

    // Verificar cada pago en Stripe
    for (const payment of pendingPayments) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          payment.stripe_checkout_session_id
        );

        if (session.payment_status === 'paid') {
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

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

          if (!paymentUpdateError) {
            // Actualizar la aplicación profesional
            const { error: applicationUpdateError } = await supabase
              .from('professional_applications')
              .update({
                registration_fee_paid: true,
                registration_fee_paid_at: now.toISOString(),
                registration_fee_expires_at: expiresAt.toISOString(),
              })
              .eq('id', payment.professional_application_id);

            if (!applicationUpdateError) {
              console.log(`✅ Pago ${payment.id} sincronizado automáticamente`);
              results.synced++;
            } else {
              console.error(`❌ Error al actualizar aplicación ${payment.professional_application_id}`);
              results.failed++;
            }
          } else {
            console.error(`❌ Error al actualizar pago ${payment.id}`);
            results.failed++;
          }
        } else {
          console.log(`⏳ Sesión ${payment.stripe_checkout_session_id} aún no pagada (${session.payment_status})`);
          results.notPaid++;
        }
      } catch (error) {
        console.error(`❌ Error al verificar pago ${payment.id}:`, error);
        results.failed++;
      }
    }

    console.log(`✅ Sincronización automática completada: ${results.synced} exitosos, ${results.failed} fallidos, ${results.notPaid} sin pagar`);

    return NextResponse.json({
      message: "Sincronización automática completada",
      synced: results.synced,
      failed: results.failed,
      notPaid: results.notPaid,
      total: pendingPayments.length,
    });

  } catch (error) {
    console.error('❌ Error en cron job:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
