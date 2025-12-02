import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAppointmentInGoogleCalendar } from '@/actions/google-calendar';

/**
 * API endpoint para sincronizar una cita con Google Calendar
 * Se usa cuando los profesionales crean citas manualmente en Holistia
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener datos del request
    const { appointmentId, userId } = await request.json();

    if (!appointmentId || !userId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario autenticado es el mismo que solicita la sincronización
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para sincronizar esta cita' },
        { status: 403 }
      );
    }

    // Verificar si la cita ya tiene un evento de Google Calendar
    const { data: appointment } = await supabase
      .from('appointments')
      .select('google_calendar_event_id')
      .eq('id', appointmentId)
      .single();

    if (appointment?.google_calendar_event_id) {
      return NextResponse.json({
        success: true,
        message: 'La cita ya está sincronizada con Google Calendar',
        eventId: appointment.google_calendar_event_id
      });
    }

    // Sincronizar con Google Calendar
    const result = await createAppointmentInGoogleCalendar(appointmentId, userId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        eventId: result.eventId,
        htmlLink: result.htmlLink
      });
    } else {
      // Si falla, es probable que Google Calendar no esté conectado
      // No es un error crítico, solo lo logueamos
      const errorMessage = 'error' in result ? result.error : 'No se pudo sincronizar con Google Calendar';
      console.log('Google Calendar sync skipped:', errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error en endpoint de sincronización:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar con Google Calendar' },
      { status: 500 }
    );
  }
}
