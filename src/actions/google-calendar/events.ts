'use server';

import { createClient } from '@/utils/supabase/server';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type GoogleCalendarEvent,
} from '@/lib/google-calendar';

/**
 * Helper para obtener tokens de Google Calendar del usuario
 */
async function getUserGoogleTokens(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'google_calendar_connected, google_access_token, google_refresh_token'
    )
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('No se pudo obtener el perfil del usuario');
  }

  if (!profile.google_calendar_connected) {
    throw new Error('Google Calendar no está conectado');
  }

  if (!profile.google_access_token || !profile.google_refresh_token) {
    throw new Error('Tokens de Google Calendar no disponibles');
  }

  return {
    accessToken: profile.google_access_token,
    refreshToken: profile.google_refresh_token,
  };
}

/**
 * Crear un evento/taller en Google Calendar
 */
export async function createEventWorkshopInGoogleCalendar(
  eventId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos del evento
    const { data: event, error: eventError } = await supabase
      .from('events_workshops')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        error: 'No se pudo obtener el evento',
      };
    }

    // Verificar que el usuario es el creador del evento
    if (event.created_by !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para crear este evento en Google Calendar',
      };
    }

    // Obtener tokens de Google
    const { accessToken, refreshToken } = await getUserGoogleTokens(userId);

    // Construir el evento de Google Calendar
    const startDate = new Date(event.start_date);
    const endDate = event.end_date
      ? new Date(event.end_date)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Por defecto 2 horas

    const calendarEvent: GoogleCalendarEvent = {
      summary: event.title,
      description: `${event.description}\n\nTipo: ${
        event.event_type === 'unique' ? 'Evento Único' : 'Evento Recurrente'
      }\n${event.is_online ? 'Modalidad: Online' : `Ubicación: ${event.location || 'Por definir'}`}\n\nCapacidad máxima: ${
        event.max_capacity
      } personas\nPrecio: $${event.price} MXN`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: event.timezone || 'America/Mexico_City',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: event.timezone || 'America/Mexico_City',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
      colorId: '10', // Verde para talleres/eventos
    };

    // Agregar ubicación o link
    if (event.is_online && event.meeting_link) {
      calendarEvent.description += `\n\nEnlace del evento: ${event.meeting_link}`;
      calendarEvent.location = 'Evento Online';
    } else if (event.location) {
      calendarEvent.location = event.location;
    }

    // Crear evento en Google Calendar
    const result = await createCalendarEvent(
      accessToken,
      refreshToken,
      calendarEvent
    );

    if (!result.success) {
      return result;
    }

    // Guardar el ID del evento en la tabla events_workshops
    await supabase
      .from('events_workshops')
      .update({ google_calendar_event_id: result.eventId })
      .eq('id', eventId);

    return {
      success: true,
      eventId: result.eventId,
      htmlLink: result.htmlLink,
    };
  } catch (error: unknown) {
    console.error('Error creating event/workshop in Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Actualizar un evento/taller en Google Calendar
 */
export async function updateEventWorkshopInGoogleCalendar(
  eventId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos del evento
    const { data: event, error: eventError } = await supabase
      .from('events_workshops')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        error: 'No se pudo obtener el evento',
      };
    }

    // Verificar que el usuario es el creador del evento
    if (event.created_by !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para actualizar este evento',
      };
    }

    // Verificar que el evento tiene un evento de Google Calendar
    if (!event.google_calendar_event_id) {
      return {
        success: false,
        error: 'Este evento no tiene un evento de Google Calendar asociado',
      };
    }

    // Obtener tokens de Google
    const { accessToken, refreshToken } = await getUserGoogleTokens(userId);

    // Construir el evento actualizado
    const startDate = new Date(event.start_date);
    const endDate = event.end_date
      ? new Date(event.end_date)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const eventUpdate: Partial<GoogleCalendarEvent> = {
      summary: event.title,
      description: `${event.description}\n\nTipo: ${
        event.event_type === 'unique' ? 'Evento Único' : 'Evento Recurrente'
      }\n${event.is_online ? 'Modalidad: Online' : `Ubicación: ${event.location || 'Por definir'}`}\n\nCapacidad máxima: ${
        event.max_capacity
      } personas\nPrecio: $${event.price} MXN`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: event.timezone || 'America/Mexico_City',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: event.timezone || 'America/Mexico_City',
      },
    };

    if (event.is_online && event.meeting_link) {
      eventUpdate.description += `\n\nEnlace del evento: ${event.meeting_link}`;
      eventUpdate.location = 'Evento Online';
    } else if (event.location) {
      eventUpdate.location = event.location;
    }

    // Actualizar evento en Google Calendar
    const result = await updateCalendarEvent(
      accessToken,
      refreshToken,
      event.google_calendar_event_id,
      eventUpdate
    );

    return result;
  } catch (error: unknown) {
    console.error('Error updating event/workshop in Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Eliminar un evento/taller de Google Calendar
 */
export async function deleteEventWorkshopFromGoogleCalendar(
  eventId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos del evento
    const { data: event, error: eventError } = await supabase
      .from('events_workshops')
      .select('google_calendar_event_id, created_by')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        error: 'No se pudo obtener el evento',
      };
    }

    // Verificar que el usuario es el creador del evento
    if (event.created_by !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar este evento',
      };
    }

    // Verificar que el evento tiene un evento de Google Calendar
    if (!event.google_calendar_event_id) {
      return {
        success: true,
        message: 'Este evento no tiene un evento de Google Calendar asociado',
      };
    }

    // Obtener tokens de Google
    const { accessToken, refreshToken } = await getUserGoogleTokens(userId);

    // Eliminar evento de Google Calendar
    const result = await deleteCalendarEvent(
      accessToken,
      refreshToken,
      event.google_calendar_event_id
    );

    if (result.success) {
      // Limpiar el ID del evento
      await supabase
        .from('events_workshops')
        .update({ google_calendar_event_id: null })
        .eq('id', eventId);
    }

    return result;
  } catch (error: unknown) {
    console.error(
      'Error deleting event/workshop from Google Calendar:',
      error
    );
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Sincronizar todos los eventos futuros con Google Calendar
 */
export async function syncAllEventsToGoogleCalendar(userId: string) {
  try {
    const supabase = await createClient();

    // Obtener todos los eventos futuros del usuario que no tienen evento de Google
    const { data: events, error: eventsError } = await supabase
      .from('events_workshops')
      .select('id')
      .eq('created_by', userId)
      .gte('start_date', new Date().toISOString())
      .is('google_calendar_event_id', null);

    if (eventsError) {
      return {
        success: false,
        error: 'Error al obtener eventos',
      };
    }

    if (!events || events.length === 0) {
      return {
        success: true,
        message: 'No hay eventos para sincronizar',
        syncedCount: 0,
      };
    }

    // Sincronizar cada evento
    const results = await Promise.allSettled(
      events.map((event) =>
        createEventWorkshopInGoogleCalendar(event.id, userId)
      )
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    return {
      success: true,
      message: `Se sincronizaron ${successful} de ${events.length} eventos`,
      syncedCount: successful,
      totalCount: events.length,
    };
  } catch (error: unknown) {
    console.error('Error syncing events to Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}
