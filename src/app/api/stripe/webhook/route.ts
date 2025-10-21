import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { sendEventConfirmationEmailSimple, sendAppointmentNotificationToProfessional } from '@/lib/email-sender';
import Stripe from 'stripe';

async function sendEventConfirmationEmail(eventRegistrationId: string) {
  try {
    const supabase = await createClient();

    // Get event registration details with event and user info
    const { data: registration, error: registrationError } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events_workshops (
          name,
          event_date,
          event_time,
          location,
          duration_hours,
          category
        )
      `)
      .eq('id', eventRegistrationId)
      .single();

    if (registrationError || !registration) {
      console.error('Error fetching event registration:', registrationError);
      return;
    }

    // Get user details
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(registration.user_id);

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return;
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('event_registration_id', eventRegistrationId)
      .eq('status', 'succeeded')
      .single();

    if (paymentError || !payment) {
      console.error('Error fetching payment:', paymentError);
      return;
    }

    // Format event data
    const event = registration.events_workshops;
    const eventDate = new Date(event.event_date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const eventTime = event.event_time.substring(0, 5);
    const paymentDate = new Date(payment.paid_at!).toLocaleDateString('es-ES');

    // Get category label
    const categoryLabels = {
      espiritualidad: "Espiritualidad",
      salud_mental: "Salud Mental",
      salud_fisica: "Salud Física",
      alimentacion: "Alimentación",
      social: "Social"
    };
    const eventCategory = categoryLabels[event.category as keyof typeof categoryLabels] || event.category;

    // Prepare email data
    const emailData = {
      user_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || 'Usuario',
      user_email: user.user.email!,
      confirmation_code: registration.confirmation_code!,
      event_name: event.name,
      event_date: eventDate,
      event_time: eventTime,
      event_location: event.location,
      event_duration: event.duration_hours,
      event_category: eventCategory,
      payment_amount: payment.amount,
      payment_date: paymentDate,
      payment_method: payment.payment_method || 'Tarjeta',
      transaction_id: payment.stripe_payment_intent_id || payment.id,
      event_url: `${process.env.NEXT_PUBLIC_SITE_URL}/patient/${registration.user_id}/explore/event/${registration.event_id}`
    };

    // Send email
    const result = await sendEventConfirmationEmailSimple(emailData);

    if (result.success) {
      console.log('Event confirmation email sent successfully');
    } else {
      console.error('Failed to send event confirmation email:', result.error);
    }

  } catch (error) {
    console.error('Error in sendEventConfirmationEmail:', error);
  }
}

async function sendAppointmentNotificationEmail(appointmentId: string) {
  try {
    const supabase = await createClient();

    // Get appointment details with patient and professional info
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment:', appointmentError);
      return;
    }

    // Get patient details
    const { data: patient, error: patientError } = await supabase.auth.admin.getUserById(appointment.patient_id);

    if (patientError || !patient) {
      console.error('Error fetching patient:', patientError);
      return;
    }

    // Get professional details
    const { data: professional, error: professionalError } = await supabase.auth.admin.getUserById(appointment.professional_id);

    if (professionalError || !professional) {
      console.error('Error fetching professional:', professionalError);
      return;
    }

    // Format appointment data
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const appointmentTime = appointment.appointment_time.substring(0, 5);

    // Get appointment type label
    const typeLabels = {
      presencial: "Presencial",
      online: "Online"
    };
    const appointmentType = typeLabels[appointment.appointment_type as keyof typeof typeLabels] || appointment.appointment_type;

    // Prepare email data
    const emailData = {
      professional_name: professional.user.user_metadata?.full_name || professional.user.email?.split('@')[0] || 'Profesional',
      professional_email: professional.user.email!,
      patient_name: patient.user.user_metadata?.full_name || patient.user.email?.split('@')[0] || 'Paciente',
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_type: appointmentType,
      duration_minutes: appointment.duration_minutes || 50,
      cost: appointment.cost,
      location: appointment.location || 'Por definir',
      notes: appointment.notes,
      appointments_url: `${process.env.NEXT_PUBLIC_SITE_URL}/professional/${appointment.professional_id}/appointments`
    };

    // Send email
    const result = await sendAppointmentNotificationToProfessional(emailData);

    if (result.success) {
      console.log('Appointment notification sent successfully to professional');
    } else {
      console.error('Failed to send appointment notification:', result.error);
    }

  } catch (error) {
    console.error('Error in sendAppointmentNotificationEmail:', error);
  }
}

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
          appointment_id,
          event_registration_id
        } = session.metadata || {};

        if (!payment_id) {
          console.error('Missing payment_id in session metadata');
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
            transfer_status: 'completed', // Transfer is automatic with Connect
          })
          .eq('id', payment_id);

        if (paymentUpdateError) {
          console.error('Error updating payment:', paymentUpdateError);
          break;
        }

        // Handle appointment payments
        if (appointment_id) {
          const { error: appointmentUpdateError } = await supabase
            .from('appointments')
            .update({
              status: 'confirmed',
            })
            .eq('id', appointment_id);

          if (appointmentUpdateError) {
            console.error('Error updating appointment:', appointmentUpdateError);
          } else {
            console.log('Payment and appointment updated successfully');

            // Send notification email to professional
            try {
              await sendAppointmentNotificationEmail(appointment_id);
            } catch (emailError) {
              console.error('Error sending appointment notification email:', emailError);
              // Don't fail the webhook if email fails
            }
          }
        }

        // Handle event payments
        if (event_registration_id) {
          const { error: registrationUpdateError } = await supabase
            .from('event_registrations')
            .update({
              status: 'confirmed',
            })
            .eq('id', event_registration_id);

          if (registrationUpdateError) {
            console.error('Error updating event registration:', registrationUpdateError);
          } else {
            console.log('Payment and event registration updated successfully');
            
            // Send confirmation email for event payments
            try {
              await sendEventConfirmationEmail(event_registration_id);
            } catch (emailError) {
              console.error('Error sending event confirmation email:', emailError);
              // Don't fail the webhook if email fails
            }
          }
        }

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
            transfer_status: 'reversed',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        if (paymentUpdateError) {
          console.error('Error updating payment:', paymentUpdateError);
        }

        break;
      }

      // Note: With Stripe Connect automatic transfers, the transfer happens 
      // immediately and we track it via checkout.session.completed
      // Additional transfer events can be monitored from Stripe Dashboard

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

