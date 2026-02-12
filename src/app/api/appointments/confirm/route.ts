import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendAppointmentConfirmationToPatient } from '@/lib/email-sender';
import { createAppointmentInGoogleCalendar } from '@/actions/google-calendar';
import { formatDate } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get appointment ID from request body
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Verify the appointment exists and belongs to the professional
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('professional_id', user.id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or you do not have permission to confirm it' },
        { status: 404 }
      );
    }

    // Check if already confirmed
    const isAlreadyConfirmed = appointment.status === 'confirmed';
    const needsGoogleCalendarSync = !appointment.google_calendar_event_id;

    // Update appointment status to confirmed (if not already confirmed)
    if (!isAlreadyConfirmed) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Error confirming appointment:', updateError);
        return NextResponse.json(
          { error: 'Failed to confirm appointment' },
          { status: 500 }
        );
      }
    }

    // Get patient details for the email
    const { data: patient, error: patientError } = await supabase.auth.admin.getUserById(appointment.patient_id);

    if (patientError || !patient) {
      console.error('Error fetching patient:', patientError);
      // Don't fail the request, just log the error
    } else {
      // Get professional details
      const { data: professional, error: professionalError } = await supabase.auth.admin.getUserById(user.id);

      if (professionalError || !professional) {
        console.error('Error fetching professional:', professionalError);
      } else {
        // Format appointment data
        const appointmentDate = formatDate(appointment.appointment_date, 'es-ES', {
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

        // Get patient and professional profiles for names
        const { data: patientProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', patient.user.id)
          .single();
        
        const { data: professionalProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', professional.user.id)
          .single();

        const patientName = patientProfile 
          ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim() 
          : patient.user.email?.split('@')[0] || 'Paciente';
        
        const professionalName = professionalProfile 
          ? `${professionalProfile.first_name || ''} ${professionalProfile.last_name || ''}`.trim() 
          : professional.user.email?.split('@')[0] || 'Profesional';

        // Send confirmation email to patient
        const emailData = {
          patient_name: patientName,
          patient_email: patient.user.email!,
          professional_name: professionalName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          appointment_type: appointmentType,
          duration_minutes: appointment.duration_minutes || 50,
          cost: appointment.cost,
          location: appointment.location || 'Por definir',
          notes: appointment.notes
        };

        try {
          const emailResult = await sendAppointmentConfirmationToPatient(emailData);
          if (!emailResult.success) {
            console.error('Failed to send confirmation email to patient:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Error sending confirmation email to patient:', emailError);
        }
      }
    }

    // Try to create event in Google Calendar (non-blocking)
    // Only sync if the appointment doesn't already have a Google Calendar event ID
    if (needsGoogleCalendarSync) {
      try {
        const calendarResult = await createAppointmentInGoogleCalendar(appointmentId, user.id);
        if (calendarResult.success) {
          console.log('✅ Google Calendar event created successfully:', calendarResult.eventId);
        } else {
          const errorMessage = 'error' in calendarResult ? calendarResult.error : 'Unknown error';
          console.error('❌ Failed to create Google Calendar event:', errorMessage);
        }
      } catch (calendarError) {
        // Don't fail the request if Google Calendar sync fails
        console.error('Error creating Google Calendar event:', calendarError);
      }
    } else {
      console.log('ℹ️ Appointment already has Google Calendar event ID, skipping sync');
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment confirmed successfully'
    });

  } catch (error) {
    console.error('Error in confirm appointment endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
