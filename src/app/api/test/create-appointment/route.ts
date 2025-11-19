import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCalendarEvent, type GoogleCalendarEvent } from '@/lib/google-calendar';

/**
 * RUTA DE TESTING - SOLO PARA DESARROLLO
 * Crea una cita de prueba y la sincroniza con Google Calendar
 *
 * También puede sincronizar una cita existente si se proporciona appointmentId
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appointmentId,   // ID de cita existente (opcional)
      professionalId, // ID del professional_application
      patientId,      // ID del paciente
      appointmentDate, // Formato: "2025-11-20"
      appointmentTime, // Formato: "14:30"
      durationMinutes = 60,
      appointmentType = 'online',
      location = 'Online',
      notes = 'Cita de prueba',
    } = body;

    // Verificar que las variables de entorno estén configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { 
          error: 'Configuración faltante', 
          details: 'NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas' 
        },
        { status: 500 }
      );
    }

    // Usar service role key para evitar restricciones de RLS en ruta de test
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    let appointment;
    let professionalAppId;

    // Si se proporciona appointmentId, sincronizar cita existente
    if (appointmentId) {
      console.log('🔄 Sincronizando cita existente:', appointmentId);

      const { data: existingAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*, professional_id')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !existingAppointment) {
        return NextResponse.json(
          { error: 'No se encontró la cita con ese ID', details: fetchError },
          { status: 404 }
        );
      }

      appointment = existingAppointment;
      professionalAppId = existingAppointment.professional_id;
    } else {
      // Crear nueva cita
      if (!professionalId || !patientId || !appointmentDate || !appointmentTime) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos: professionalId, patientId, appointmentDate, appointmentTime' },
          { status: 400 }
        );
      }

      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          professional_id: professionalId,
          patient_id: patientId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration_minutes: durationMinutes,
          appointment_type: appointmentType,
          location: location,
          notes: notes,
          status: 'confirmed',
          cost: 700.00,
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        return NextResponse.json(
          { error: 'Error al crear la cita', details: appointmentError },
          { status: 500 }
        );
      }

      appointment = newAppointment;
      professionalAppId = professionalId;
      console.log('✅ Cita creada en la BD:', appointment.id);
    }

    // 2. Obtener el user_id del profesional
    const { data: professionalApp, error: professionalAppError } = await supabase
      .from('professional_applications')
      .select('user_id')
      .eq('id', professionalAppId)
      .single();

    if (professionalAppError || !professionalApp) {
      console.error('Error getting professional:', professionalAppError);
      return NextResponse.json(
        {
          success: true,
          appointment,
          warning: 'Cita creada/encontrada pero no se pudo obtener el profesional para sincronizar con Google Calendar',
        },
        { status: 200 }
      );
    }

    // 3. Obtener datos del paciente y profesional para Google Calendar
    const { data: patientData, error: patientError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', appointment.patient_id)
      .single();

    const { data: professionalData, error: professionalDataError } = await supabase
      .from('professional_applications')
      .select('first_name, last_name, profession')
      .eq('id', professionalAppId)
      .single();

    // 4. Obtener tokens de Google Calendar del profesional
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_connected, google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', professionalApp.user_id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        {
          success: true,
          appointment,
          googleCalendar: {
            synced: false,
            error: 'No se pudo obtener el perfil del profesional',
          },
        },
        { status: 200 }
      );
    }

    if (!profileData.google_calendar_connected) {
      return NextResponse.json(
        {
          success: true,
          appointment,
          googleCalendar: {
            synced: false,
            error: 'Google Calendar no está conectado para este profesional',
          },
        },
        { status: 200 }
      );
    }

    if (!profileData.google_access_token || !profileData.google_refresh_token) {
      return NextResponse.json(
        {
          success: true,
          appointment,
          googleCalendar: {
            synced: false,
            error: 'Tokens de Google Calendar no disponibles',
          },
        },
        { status: 200 }
      );
    }

    // 5. Sincronizar con Google Calendar usando los tokens
    try {
      const startDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const endDate = new Date(startDate.getTime() + appointment.duration_minutes * 60000);

      const patientName = patientData 
        ? `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() 
        : 'Paciente';
      const patientEmail = patientData?.email || '';

      const professionalName = professionalData
        ? `${professionalData.first_name || ''} ${professionalData.last_name || ''}`.trim()
        : 'Profesional';
      const profession = professionalData?.profession || 'Consulta';

      const calendarEvent: GoogleCalendarEvent = {
        summary: `Cita con ${patientName}`,
        description: `Cita de ${profession}\n${appointment.notes || ''}\n\nPaciente: ${patientName}\nEmail: ${patientEmail}`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        attendees: patientEmail ? [{ email: patientEmail, displayName: patientName }] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 día antes
            { method: 'popup', minutes: 30 }, // 30 minutos antes
          ],
        },
      };

      if (appointment.appointment_type === 'online') {
        calendarEvent.location = 'Sesión Online';
      } else if (appointment.location) {
        calendarEvent.location = appointment.location;
      }

      const result = await createCalendarEvent(
        profileData.google_access_token,
        profileData.google_refresh_token,
        calendarEvent
      );

      if (result.success) {
        // Actualizar el appointment con el event ID
        await supabase
          .from('appointments')
          .update({ google_calendar_event_id: result.eventId })
          .eq('id', appointment.id);

        console.log('✅ Cita sincronizada con Google Calendar:', result.eventId);
        return NextResponse.json(
          {
            success: true,
            appointment: {
              ...appointment,
              google_calendar_event_id: result.eventId,
            },
            googleCalendar: {
              synced: true,
              eventId: result.eventId,
              htmlLink: result.htmlLink,
            },
          },
          { status: 200 }
        );
      } else {
        const errorMessage = 'error' in result ? result.error : 'Unknown error';
        console.log('⚠️ Google Calendar sync failed:', errorMessage);
        return NextResponse.json(
          {
            success: true,
            appointment,
            googleCalendar: {
              synced: false,
              error: errorMessage,
            },
          },
          { status: 200 }
        );
      }
    } catch (calendarError) {
      console.error('Error creating calendar event:', calendarError);
      return NextResponse.json(
        {
          success: true,
          appointment,
          googleCalendar: {
            synced: false,
            error: calendarError instanceof Error ? calendarError.message : String(calendarError),
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
