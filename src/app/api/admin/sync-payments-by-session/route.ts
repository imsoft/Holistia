import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * Admin endpoint to sync payment statuses with Stripe using checkout session IDs
 * This fixes payments that are stuck in 'processing' status and don't have payment_intent_id
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

    console.log('🔄 Starting payment sync by checkout session...');

    // Get all payments with stripe_checkout_session_id that are in processing or pending status
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .not('stripe_checkout_session_id', 'is', null)
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
        // Get checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(
          payment.stripe_checkout_session_id
        );

        console.log(`💳 Payment ${payment.id}: Session status = ${session.status}, Payment status = ${session.payment_status}`);

        let newStatus = payment.status;
        let updateData: Record<string, any> = {};

        // Map Stripe session status to our status
        if (session.payment_status === 'paid') {
          newStatus = 'succeeded';
          updateData = {
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent as string || null,
            paid_at: new Date().toISOString(),
            payment_method: session.payment_method_types?.[0] || null,
            transfer_status: 'completed',
          };

          // Also update appointment status to confirmed
          if (payment.appointment_id) {
            await supabase
              .from('appointments')
              .update({ status: 'confirmed' })
              .eq('id', payment.appointment_id);
            console.log(`✅ Updated appointment ${payment.appointment_id} to confirmed`);
          }

          // Update event registration if exists
          if (payment.event_registration_id) {
            await supabase
              .from('event_registrations')
              .update({ status: 'confirmed' })
              .eq('id', payment.event_registration_id);
            console.log(`✅ Updated event registration ${payment.event_registration_id} to confirmed`);
          }

          // Update professional application registration if exists
          if (payment.professional_application_id) {
            await supabase
              .from('professional_applications')
              .update({
                registration_fee_paid: true,
                registration_fee_paid_at: new Date().toISOString(),
              })
              .eq('id', payment.professional_application_id);
            console.log(`✅ Updated professional application ${payment.professional_application_id} registration fee`);
          }
        } else if (session.payment_status === 'unpaid') {
          if (session.status === 'expired') {
            newStatus = 'cancelled';
            updateData = { status: 'cancelled' };
          } else {
            newStatus = 'pending';
            updateData = { status: 'pending' };
          }
        }

        // Update payment if status changed
        if (newStatus !== payment.status || Object.keys(updateData).length > 1) {
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
              session_payment_status: session.payment_status,
            });
          }
        } else {
          console.log(`ℹ️ Payment ${payment.id} already has correct status: ${newStatus}`);
        }

      } catch (stripeError: any) {
        console.error(`❌ Error checking payment ${payment.id} with Stripe:`, stripeError);
        failedCount++;
        results.push({
          payment_id: payment.id,
          success: false,
          error: stripeError?.message || 'Unknown error',
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
    console.error('❌ Error in sync-payments-by-session:', error);
    return NextResponse.json(
      {
        error: 'Error al sincronizar pagos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
