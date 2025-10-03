import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Checkout session completed:', session.id);
        
        // Get metadata from session
        const { 
          payment_id, 
          appointment_id
        } = session.metadata || {};

        if (!payment_id || !appointment_id) {
          console.error('Missing metadata in session');
          break;
        }

        // Update payment record
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'succeeded',
            paid_at: new Date().toISOString(),
            payment_method: session.payment_method_types?.[0] || null,
          })
          .eq('id', payment_id);

        if (paymentUpdateError) {
          console.error('Error updating payment:', paymentUpdateError);
          break;
        }

        // Update appointment status to confirmed
        const { error: appointmentUpdateError } = await supabase
          .from('appointments')
          .update({
            status: 'confirmed',
          })
          .eq('id', appointment_id);

        if (appointmentUpdateError) {
          console.error('Error updating appointment:', appointmentUpdateError);
        }

        console.log('Payment and appointment updated successfully');
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('Payment intent succeeded:', paymentIntent.id);

        // Update payment record if not already updated
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .is('paid_at', null);

        if (paymentUpdateError) {
          console.error('Error updating payment:', paymentUpdateError);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('Payment intent failed:', paymentIntent.id);

        // Update payment record to failed
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating payment:', paymentUpdateError);
        }

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        console.log('Charge refunded:', charge.id);

        // Update payment record to refunded
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        if (paymentUpdateError) {
          console.error('Error updating payment:', paymentUpdateError);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

