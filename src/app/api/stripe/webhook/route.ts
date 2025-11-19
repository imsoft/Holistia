import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import {
  sendEventConfirmationEmailSimple,
  sendAppointmentNotificationToProfessional,
  sendAppointmentPaymentConfirmation,
  sendRegistrationPaymentConfirmation
} from '@/lib/email-sender';
import { createAppointmentInGoogleCalendar } from '@/actions/google-calendar';
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

    // Get user profile for name
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.user.id)
      .single();
    
    const userName = userProfile 
      ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() 
      : user.user.email?.split('@')[0] || 'Usuario';

    // Prepare email data
    const emailData = {
      user_name: userName,
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

    // Get professional application details for address
    const { data: professionalApp, error: professionalAppError } = await supabase
      .from('professional_applications')
      .select('*')
      .eq('id', appointment.professional_id)
      .single();

    if (professionalAppError || !professionalApp) {
      console.error('Error fetching professional application:', professionalAppError);
      return;
    }

    // Get service details to check for specific address
    let serviceAddress = null;
    if (appointment.service_id) {
      const { data: service, error: serviceError } = await supabase
        .from('professional_services')
        .select('address')
        .eq('id', appointment.service_id)
        .single();
      
      if (!serviceError && service?.address) {
        serviceAddress = service.address;
      }
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

    // Get professional and patient profiles for names
    const { data: professionalProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', professional.user.id)
      .single();
    
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', patient.user.id)
      .single();

    const professionalName = professionalProfile 
      ? `${professionalProfile.first_name || ''} ${professionalProfile.last_name || ''}`.trim() 
      : professional.user.email?.split('@')[0] || 'Profesional';
    
    const patientName = patientProfile 
      ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim() 
      : patient.user.email?.split('@')[0] || 'Paciente';

    // Determine the location to use
    const finalLocation = serviceAddress || 
                         appointment.location || 
                         `${professionalApp.address}, ${professionalApp.city}, ${professionalApp.state}` || 
                         'Por definir';

    // Prepare email data
    const emailData = {
      professional_name: professionalName,
      professional_email: professional.user.email!,
      patient_name: patientName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_type: appointmentType,
      duration_minutes: appointment.duration_minutes || 50,
      cost: appointment.cost,
      location: finalLocation,
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

async function sendAppointmentTicketEmail(appointmentId: string) {
  try {
    const supabase = await createClient();

    // Get appointment details
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

    // Get professional details from professional_applications
    const { data: professionalApp, error: professionalAppError } = await supabase
      .from('professional_applications')
      .select('*')
      .eq('id', appointment.professional_id)
      .single();

    if (professionalAppError || !professionalApp) {
      console.error('Error fetching professional application:', professionalAppError);
      return;
    }

    // Get service details to check for specific address
    let serviceAddress = null;
    if (appointment.service_id) {
      const { data: service, error: serviceError } = await supabase
        .from('professional_services')
        .select('address')
        .eq('id', appointment.service_id)
        .single();
      
      if (!serviceError && service?.address) {
        serviceAddress = service.address;
      }
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('status', 'succeeded')
      .single();

    if (paymentError || !payment) {
      console.error('Error fetching payment:', paymentError);
      return;
    }

    // Format data
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const appointmentTime = appointment.appointment_time.substring(0, 5);
    const paymentDate = new Date(payment.paid_at!).toLocaleDateString('es-ES');

    const typeLabels = {
      presencial: "Presencial",
      online: "Online"
    };
    const appointmentType = typeLabels[appointment.appointment_type as keyof typeof typeLabels] || appointment.appointment_type;

    // Get patient profile for name
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', patient.user.id)
      .single();
    
    const patientName = patientProfile 
      ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim() 
      : patient.user.email?.split('@')[0] || 'Paciente';

    // Determine the location to use
    const finalLocation = serviceAddress || 
                         appointment.location || 
                         `${professionalApp.address}, ${professionalApp.city}, ${professionalApp.state}` || 
                         'Por definir';

    // Prepare ticket email data
    const ticketData = {
      patient_name: patientName,
      patient_email: patient.user.email!,
      professional_name: `${professionalApp.first_name} ${professionalApp.last_name}`,
      professional_title: professionalApp.profession,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_type: appointmentType,
      duration_minutes: appointment.duration_minutes || 50,
      location: finalLocation,
      payment_amount: Number(payment.amount),
      payment_date: paymentDate,
      payment_method: payment.payment_method || 'Tarjeta',
      transaction_id: payment.stripe_payment_intent_id || payment.id,
      ticket_number: appointment.id.substring(0, 8).toUpperCase(),
    };

    // Send ticket email
    const result = await sendAppointmentPaymentConfirmation(ticketData);

    if (result.success) {
      console.log('Appointment ticket sent successfully to patient');
    } else {
      console.error('Failed to send appointment ticket:', result.error);
    }

  } catch (error) {
    console.error('Error in sendAppointmentTicketEmail:', error);
  }
}

async function sendRegistrationReceiptEmail(professionalApplicationId: string) {
  try {
    const supabase = await createClient();

    // Get professional application details
    const { data: professionalApp, error: appError } = await supabase
      .from('professional_applications')
      .select('*')
      .eq('id', professionalApplicationId)
      .single();

    if (appError || !professionalApp) {
      console.error('Error fetching professional application:', appError);
      return;
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('professional_application_id', professionalApplicationId)
      .eq('payment_type', 'registration')
      .eq('status', 'succeeded')
      .single();

    if (paymentError || !payment) {
      console.error('Error fetching payment:', paymentError);
      return;
    }

    // Format data
    const paymentDate = new Date(payment.paid_at!).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const expirationDate = new Date(professionalApp.registration_fee_expires_at!).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prepare receipt email data
    const receiptData = {
      professional_name: `${professionalApp.first_name} ${professionalApp.last_name}`,
      professional_email: professionalApp.email,
      profession: professionalApp.profession,
      payment_amount: Number(payment.amount),
      payment_date: paymentDate,
      payment_method: payment.payment_method || 'Tarjeta',
      transaction_id: payment.stripe_payment_intent_id || payment.id,
      expiration_date: expirationDate,
      dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL}/professional/${professionalApp.id}/dashboard`
    };

    // Send receipt email
    const result = await sendRegistrationPaymentConfirmation(receiptData);

    if (result.success) {
      console.log('Registration receipt sent successfully to professional');
    } else {
      console.error('Failed to send registration receipt:', result.error);
    }

  } catch (error) {
    console.error('Error in sendRegistrationReceiptEmail:', error);
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
          event_registration_id,
          professional_application_id,
          payment_type
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
          // Mark appointment as paid, but keep it as 'pending' until professional confirms
          const { error: appointmentUpdateError } = await supabase
            .from('appointments')
            .update({
              status: 'paid', // Changed from 'confirmed' to 'paid'
            })
            .eq('id', appointment_id);

          if (appointmentUpdateError) {
            console.error('Error updating appointment:', appointmentUpdateError);
          } else {
            console.log('Payment processed successfully - appointment marked as paid');

            // Get appointment details to find the professional's user_id
            const { data: appointment, error: appointmentFetchError } = await supabase
              .from('appointments')
              .select('professional_id')
              .eq('id', appointment_id)
              .single();

            if (!appointmentFetchError && appointment) {
              // Get professional's user_id from professional_applications
              const { data: professionalApp, error: professionalAppError } = await supabase
                .from('professional_applications')
                .select('user_id')
                .eq('id', appointment.professional_id)
                .single();

              if (!professionalAppError && professionalApp) {
                // Try to sync with Google Calendar
                try {
                  const googleCalendarResult = await createAppointmentInGoogleCalendar(
                    appointment_id,
                    professionalApp.user_id
                  );

                  if (googleCalendarResult.success) {
                    console.log('Appointment synced to Google Calendar successfully:', googleCalendarResult.eventId);
                  } else {
                    const errorMessage = 'error' in googleCalendarResult ? googleCalendarResult.error : 'Unknown error';
                    console.log('Google Calendar sync skipped or failed:', errorMessage);
                    // This is not critical - the appointment is still valid in our DB
                  }
                } catch (googleError) {
                  console.error('Error syncing to Google Calendar:', googleError);
                  // Don't fail the webhook if Google Calendar sync fails
                }
              }
            }

            // Send notification email to professional (they need to confirm)
            try {
              await sendAppointmentNotificationEmail(appointment_id);
            } catch (emailError) {
              console.error('Error sending appointment notification email:', emailError);
              // Don't fail the webhook if email fails
            }

            // Send payment confirmation ticket to patient
            try {
              await sendAppointmentTicketEmail(appointment_id);
            } catch (emailError) {
              console.error('Error sending appointment ticket email:', emailError);
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

        // Handle registration fee payments
        if (payment_type === 'registration' && professional_application_id) {
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Expira en 1 año

          const { error: applicationUpdateError } = await supabase
            .from('professional_applications')
            .update({
              registration_fee_paid: true,
              registration_fee_paid_at: now.toISOString(),
              registration_fee_expires_at: expiresAt.toISOString(),
            })
            .eq('id', professional_application_id);

          if (applicationUpdateError) {
            console.error('Error updating professional application:', applicationUpdateError);
          } else {
            console.log('Registration fee payment confirmed for application:', professional_application_id);
            console.log('Payment expires at:', expiresAt.toISOString());

            // Send registration receipt to professional
            try {
              await sendRegistrationReceiptEmail(professional_application_id);
            } catch (emailError) {
              console.error('Error sending registration receipt email:', emailError);
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

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;

        console.log('Charge succeeded:', charge.id);

        // Update payment record if not already updated
        // This serves as a backup to payment_intent.succeeded
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .is('paid_at', null);

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

