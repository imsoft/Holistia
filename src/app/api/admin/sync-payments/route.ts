import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * Admin endpoint to sync payment statuses with Stripe
 * This fixes payments that are stuck in 'processing' status
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar tipo de usuario desde profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profile?.type !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    console.log('🔄 Starting payment sync...');

    // Get all payments with stripe_payment_intent_id that are in processing or pending status
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .not('stripe_payment_intent_id', 'is', null)
      .in('status', ['processing', 'pending']);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json(
        { error: 'Error al obtener pagos' },
        { status: 500 }
      );
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({
        message: 'No hay pagos para sincronizar',
        updated: 0,
      });
    }

    console.log(`📋 Found ${payments.length} payments to check`);

    let updatedCount = 0;
    let failedCount = 0;
    const results = [];

    // Check each payment with Stripe
    for (const payment of payments) {
      try {
        // Get payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripe_payment_intent_id
        );

        console.log(`💳 Payment ${payment.id}: Stripe status = ${paymentIntent.status}`);

        let newStatus = payment.status;
        let updateData: Record<string, string | boolean> = {};

        // Map Stripe status to our status
        switch (paymentIntent.status) {
          case 'succeeded':
            newStatus = 'succeeded';
            updateData = {
              status: 'succeeded',
              paid_at: new Date(paymentIntent.created * 1000).toISOString(),
              transfer_status: 'completed',
            };

            // Also update appointment status to confirmed
            if (payment.appointment_id) {
              await supabase
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', payment.appointment_id);
            }

            // Update event registration if exists
            if (payment.event_registration_id) {
              await supabase
                .from('event_registrations')
                .update({ status: 'confirmed' })
                .eq('id', payment.event_registration_id);
            }
            break;

          case 'processing':
          case 'requires_capture':
            newStatus = 'processing';
            updateData = { status: 'processing' };
            break;

          case 'canceled':
            newStatus = 'cancelled';
            updateData = { status: 'cancelled' };
            break;

          case 'requires_payment_method':
          case 'requires_confirmation':
          case 'requires_action':
            newStatus = 'pending';
            updateData = { status: 'pending' };
            break;

          default:
            console.log(`⚠️ Unknown Stripe status: ${paymentIntent.status}`);
            break;
        }

        // Update payment if status changed
        if (newStatus !== payment.status) {
          const { error: updateError } = await supabase
            .from('payments')
            .update(updateData)
            .eq('id', payment.id);

          if (updateError) {
            console.error(`❌ Error updating payment ${payment.id}:`, updateError);
            failedCount++;
            results.push({
              payment_id: payment.id,
              success: false,
              error: updateError.message,
            });
          } else {
            console.log(`✅ Updated payment ${payment.id}: ${payment.status} → ${newStatus}`);
            updatedCount++;
            results.push({
              payment_id: payment.id,
              success: true,
              old_status: payment.status,
              new_status: newStatus,
            });
          }
        } else {
          console.log(`ℹ️ Payment ${payment.id} already has correct status: ${newStatus}`);
        }

      } catch (stripeError) {
        console.error(`❌ Error checking payment ${payment.id} with Stripe:`, stripeError);
        failedCount++;
        results.push({
          payment_id: payment.id,
          success: false,
          error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ Sync complete: ${updatedCount} updated, ${failedCount} failed`);

    return NextResponse.json({
      message: 'Sincronización completada',
      total_checked: payments.length,
      updated: updatedCount,
      failed: failedCount,
      results,
    });

  } catch (error) {
    console.error('❌ Error in sync-payments:', error);
    return NextResponse.json(
      {
        error: 'Error al sincronizar pagos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
