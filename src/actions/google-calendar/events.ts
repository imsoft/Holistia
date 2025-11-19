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

    // Verificar que el usuario es el dueño del evento (owner_id)
    if (event.owner_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para crear este evento en Google Calendar',
      };
    }

    // Obtener tokens de Google
    let accessToken: string;
    let refreshToken: string;
    try {
      const tokens = await getUserGoogleTokens(userId);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    } catch (tokenError) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Error al obtener tokens de Google Calendar';
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Construir el evento de Google Calendar
    const startDate = new Date(`${event.event_date}T${event.event_time}`);
    const endDate = event.end_date && event.end_time
      ? new Date(`${event.end_date}T${event.end_time}`)
      : new Date(startDate.getTime() + (event.duration_hours || 2) * 60 * 60 * 1000);

    const calendarEvent: GoogleCalendarEvent = {
      summary: event.name,
      description: `${event.description || ''}\n\nTipo: ${
        event.session_type === 'unique' ? 'Evento Único' : 'Evento Recurrente'
      }\nUbicación: ${event.location || 'Por definir'}\n\nCapacidad máxima: ${
        event.max_capacity
      } personas\nPrecio: ${event.is_free ? 'Gratis' : `$${event.price} MXN`}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      location: event.location || undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
      colorId: '10', // Verde para talleres/eventos
    };

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

    // Verificar que el usuario es el dueño del evento (owner_id)
    if (event.owner_id !== userId) {
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
    let accessToken: string;
    let refreshToken: string;
    try {
      const tokens = await getUserGoogleTokens(userId);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    } catch (tokenError) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Error al obtener tokens de Google Calendar';
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Construir el evento actualizado
    const startDate = new Date(`${event.event_date}T${event.event_time}`);
    const endDate = event.end_date && event.end_time
      ? new Date(`${event.end_date}T${event.end_time}`)
      : new Date(startDate.getTime() + (event.duration_hours || 2) * 60 * 60 * 1000);

    const eventUpdate: Partial<GoogleCalendarEvent> = {
      summary: event.name,
      description: `${event.description || ''}\n\nTipo: ${
        event.session_type === 'unique' ? 'Evento Único' : 'Evento Recurrente'
      }\nUbicación: ${event.location || 'Por definir'}\n\nCapacidad máxima: ${
        event.max_capacity
      } personas\nPrecio: ${event.is_free ? 'Gratis' : `$${event.price} MXN`}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      location: event.location || undefined,
    };

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
      .select('google_calendar_event_id, owner_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        error: 'No se pudo obtener el evento',
      };
    }

    // Verificar que el usuario es el dueño del evento (owner_id)
    if (event.owner_id !== userId) {
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
    let accessToken: string;
    let refreshToken: string;
    try {
      const tokens = await getUserGoogleTokens(userId);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    } catch (tokenError) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Error al obtener tokens de Google Calendar';
      return {
        success: false,
        error: errorMessage,
      };
    }

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
    // Buscar por owner_id (el dueño del evento) en lugar de created_by
    const { data: events, error: eventsError } = await supabase
      .from('events_workshops')
      .select('id, name, event_date')
      .eq('owner_id', userId)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .is('google_calendar_event_id', null)
      .eq('is_active', true);

    if (eventsError) {
      console.error('Error al obtener eventos de la base de datos:', eventsError);
      return {
        success: false,
        error: `Error al obtener eventos: ${eventsError.message || 'Error desconocido'}`,
      };
    }

    if (!events || events.length === 0) {
      console.log('No se encontraron eventos para sincronizar. Verificando consulta...', {
        userId,
        eventDate: new Date().toISOString().split('T')[0],
      });
      return {
        success: true,
        message: 'No hay eventos para sincronizar',
        syncedCount: 0,
      };
    }

    console.log(`Encontrados ${events.length} eventos para sincronizar:`, events.map(e => ({ id: e.id, name: e.name, date: e.event_date })));

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
