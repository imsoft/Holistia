import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAppointmentInGoogleCalendar } from '@/actions/google-calendar';

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

    // Usar service role key para evitar restricciones de RLS en ruta de test
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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

    // 3. Sincronizar con Google Calendar
    const googleCalendarResult = await createAppointmentInGoogleCalendar(
      appointment.id,
      professionalApp.user_id
    );

    if (googleCalendarResult.success) {
      console.log('✅ Cita sincronizada con Google Calendar:', googleCalendarResult.eventId);
      return NextResponse.json(
        {
          success: true,
          appointment,
          googleCalendar: {
            synced: true,
            eventId: googleCalendarResult.eventId,
            htmlLink: googleCalendarResult.htmlLink,
          },
        },
        { status: 200 }
      );
    } else {
      const errorMessage = 'error' in googleCalendarResult ? googleCalendarResult.error : 'Unknown error';
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
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
