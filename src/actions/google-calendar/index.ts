'use server';

import { createClient } from '@/utils/supabase/server';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  getCalendarEvent,
  refreshAccessToken,
  type GoogleCalendarEvent,
} from '@/lib/google-calendar';
import { formatForGoogleCalendar, PLATFORM_TIMEZONE } from '@/lib/availability';

/**
 * Helper para obtener tokens de Google Calendar del usuario
 */
async function getUserGoogleTokens(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'google_calendar_connected, google_access_token, google_refresh_token, google_token_expires_at'
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

  // Verificar si el token está expirado y refrescarlo si es necesario
  const tokenExpired = profile.google_token_expires_at
    ? new Date(profile.google_token_expires_at) < new Date()
    : true;

  let accessToken = profile.google_access_token;

  if (tokenExpired) {
    const newCredentials = await refreshAccessToken(
      profile.google_refresh_token
    );

    if (newCredentials.access_token) {
      accessToken = newCredentials.access_token;

      // Actualizar tokens en la base de datos
      const expiresAt = new Date(
        Date.now() + (newCredentials.expiry_date || 3600 * 1000)
      );

      await supabase
        .from('profiles')
        .update({
          google_access_token: accessToken,
          google_token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);
    }
  }

  return {
    accessToken,
    refreshToken: profile.google_refresh_token,
  };
}

/**
 * Crear un evento en Google Calendar desde una cita
 */
export async function createAppointmentInGoogleCalendar(
  appointmentId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos de la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(
        `
        *,
        patient:patient_id(email, first_name, last_name),
        professional:professional_id(
          user_id,
          first_name,
          last_name,
          profession
        )
      `
      )
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return {
        success: false,
        error: 'No se pudo obtener la cita',
      };
    }

    // Verificar que el usuario es el profesional de esta cita
    const professional = Array.isArray(appointment.professional)
      ? appointment.professional[0]
      : appointment.professional;

    if (professional?.user_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para crear este evento',
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

    // Construir el evento de Google Calendar.
    // Las citas se almacenan como "wall clock" (hora local de plataforma).
    // Usamos formatForGoogleCalendar para generar dateTime SIN 'Z' (Google lo interpreta con timeZone).
    const timeNorm = String(appointment.appointment_time).slice(0, 5);
    const { startDateTime, endDateTime } = formatForGoogleCalendar(
      appointment.appointment_date,
      timeNorm,
      appointment.duration_minutes
    );

    const event: GoogleCalendarEvent = {
      summary: `Cita con ${appointment.patient.first_name} ${appointment.patient.last_name}`,
      description: `Cita de ${professional.profession}\n${
        appointment.notes || ''
      }\n\nPaciente: ${appointment.patient.first_name} ${
        appointment.patient.last_name
      }\nEmail: ${appointment.patient.email}`,
      start: {
        dateTime: startDateTime,
        timeZone: PLATFORM_TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: PLATFORM_TIMEZONE,
      },
      attendees: [
        {
          email: appointment.patient.email,
          displayName: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 30 }, // 30 minutos antes
        ],
      },
    };

    // Si la cita es online o presencial
    if (appointment.appointment_type === 'online') {
      event.location = 'Sesión Online';
    } else if (appointment.location) {
      event.location = appointment.location;
    }

    // Crear evento en Google Calendar
    const result = await createCalendarEvent(
      accessToken,
      refreshToken,
      event
    );

    if (!result.success) {
      return result;
    }

    // Guardar el ID del evento en la cita
    await supabase
      .from('appointments')
      .update({ google_calendar_event_id: result.eventId })
      .eq('id', appointmentId);

    return {
      success: true,
      eventId: result.eventId,
      htmlLink: result.htmlLink,
    };
  } catch (error: unknown) {
    console.error('Error creating appointment in Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Actualizar un evento de Google Calendar desde una cita
 */
export async function updateAppointmentInGoogleCalendar(
  appointmentId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos de la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(
        `
        *,
        patient:patient_id(email, first_name, last_name),
        professional:professional_id(
          user_id,
          first_name,
          last_name,
          profession
        )
      `
      )
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return {
        success: false,
        error: 'No se pudo obtener la cita',
      };
    }

    // Verificar que el usuario es el profesional de esta cita
    const professional = Array.isArray(appointment.professional)
      ? appointment.professional[0]
      : appointment.professional;

    if (professional?.user_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para actualizar este evento',
      };
    }

    // Verificar que la cita tiene un evento de Google Calendar
    if (!appointment.google_calendar_event_id) {
      return {
        success: false,
        error: 'Esta cita no tiene un evento de Google Calendar asociado',
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

    // Construir el evento actualizado — misma lógica timezone-safe que create
    const updateTimeNorm = String(appointment.appointment_time).slice(0, 5);
    const { startDateTime: updStartDT, endDateTime: updEndDT } = formatForGoogleCalendar(
      appointment.appointment_date,
      updateTimeNorm,
      appointment.duration_minutes
    );

    const eventUpdate: Partial<GoogleCalendarEvent> = {
      summary: `Cita con ${appointment.patient.first_name} ${appointment.patient.last_name}`,
      description: `Cita de ${professional.profession}\n${
        appointment.notes || ''
      }\n\nPaciente: ${appointment.patient.first_name} ${
        appointment.patient.last_name
      }\nEmail: ${appointment.patient.email}`,
      start: {
        dateTime: updStartDT,
        timeZone: PLATFORM_TIMEZONE,
      },
      end: {
        dateTime: updEndDT,
        timeZone: PLATFORM_TIMEZONE,
      },
    };

    if (appointment.appointment_type === 'online') {
      eventUpdate.location = 'Sesión Online';
    } else if (appointment.location) {
      eventUpdate.location = appointment.location;
    }

    // Actualizar evento en Google Calendar
    const result = await updateCalendarEvent(
      accessToken,
      refreshToken,
      appointment.google_calendar_event_id,
      eventUpdate
    );

    return result;
  } catch (error: unknown) {
    console.error('Error updating appointment in Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Eliminar un evento de Google Calendar
 */
export async function deleteAppointmentFromGoogleCalendar(
  appointmentId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos de la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(
        `
        google_calendar_event_id,
        professional:professional_id(user_id)
      `
      )
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return {
        success: false,
        error: 'No se pudo obtener la cita',
      };
    }

    // Verificar que el usuario es el profesional de esta cita
    const professional = Array.isArray(appointment.professional)
      ? appointment.professional[0]
      : appointment.professional;

    if (professional?.user_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar este evento',
      };
    }

    // Verificar que la cita tiene un evento de Google Calendar
    if (!appointment.google_calendar_event_id) {
      return {
        success: true,
        message: 'Esta cita no tiene un evento de Google Calendar asociado',
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
      appointment.google_calendar_event_id
    );

    if (result.success) {
      // Limpiar el ID del evento en la cita
      await supabase
        .from('appointments')
        .update({ google_calendar_event_id: null })
        .eq('id', appointmentId);
    }

    return result;
  } catch (error: unknown) {
    console.error('Error deleting appointment from Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Listar eventos del calendario del usuario
 */
export async function listUserGoogleCalendarEvents(userId: string) {
  try {
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

    // Listar eventos de los próximos 30 días
    const timeMin = new Date().toISOString();
    const timeMax = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = await listCalendarEvents(accessToken, refreshToken, {
      timeMin,
      timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return result;
  } catch (error: unknown) {
    console.error('Error listing Google Calendar events:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Obtener un evento específico de Google Calendar
 */
export async function getGoogleCalendarEvent(
  userId: string,
  eventId: string
) {
  try {
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

    const result = await getCalendarEvent(accessToken, refreshToken, eventId);

    return result;
  } catch (error: unknown) {
    console.error('Error getting Google Calendar event:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Crear un bloqueo de disponibilidad en Google Calendar
 */
export async function createBlockInGoogleCalendar(
  blockId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos del bloqueo
    const { data: block, error: blockError } = await supabase
      .from('availability_blocks')
      .select('*, professional_id')
      .eq('id', blockId)
      .single();

    if (blockError || !block) {
      return {
        success: false,
        error: 'No se pudo obtener el bloqueo',
      };
    }

    // Verificar que el usuario es el profesional de este bloqueo
    const { data: professional, error: profError } = await supabase
      .from('professional_applications')
      .select('user_id')
      .eq('id', block.professional_id)
      .single();

    if (profError || !professional || professional.user_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para crear este evento',
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

    // Construir el evento de Google Calendar según el tipo de bloqueo
    let event: GoogleCalendarEvent;

    if (block.block_type === 'full_day' || block.block_type === 'weekly_day') {
      // Bloqueo de día completo — usar fecha directa sin new Date() para evitar UTC shift
      const blockStartDate = block.start_date; // ya es YYYY-MM-DD
      // Agregar un día a la fecha final porque Google Calendar usa fechas exclusivas
      const endDateStr = block.end_date || block.start_date;
      const [ey, em, ed] = endDateStr.split('-').map(Number);
      const endDateObj = new Date(ey, em - 1, ed + 1); // +1 día (exclusivo)
      const blockEndDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

      event = {
        summary: block.title || 'Bloqueado',
        description: `Bloqueo de disponibilidad en Holistia${block.is_recurring ? ' (Recurrente)' : ''}`,
        start: {
          date: blockStartDate,
          timeZone: PLATFORM_TIMEZONE,
        },
        end: {
          date: blockEndDate,
          timeZone: PLATFORM_TIMEZONE,
        },
        transparency: 'opaque', // Marca como ocupado
        colorId: '11', // Color rojo para bloqueos
      };

      // Para bloqueos recurrentes por día de semana
      if (block.is_recurring && block.day_of_week) {
        const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const dayIndex = block.day_of_week === 7 ? 0 : block.day_of_week; // Convertir 7 (domingo) a 0
        event.recurrence = [
          `RRULE:FREQ=WEEKLY;BYDAY=${daysOfWeek[dayIndex]}`
        ];
      }
    } else {
      // Bloqueo de rango de horas — usar formatForGoogleCalendar para timezone-safe
      const blockStartTime = String(block.start_time).slice(0, 5);
      const blockEndTime = String(block.end_time).slice(0, 5);
      const blockStartDT = `${block.start_date}T${blockStartTime}:00`;
      const blockEndDT = `${block.start_date}T${blockEndTime}:00`;

      event = {
        summary: block.title || 'Bloqueado',
        description: `Bloqueo de disponibilidad en Holistia${block.is_recurring ? ' (Recurrente)' : ''}`,
        start: {
          dateTime: blockStartDT,
          timeZone: PLATFORM_TIMEZONE,
        },
        end: {
          dateTime: blockEndDT,
          timeZone: PLATFORM_TIMEZONE,
        },
        transparency: 'opaque',
        colorId: '11',
      };

      // Para bloqueos recurrentes de rango de horas
      if (block.is_recurring && block.block_type === 'weekly_range') {
        const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        // Parseo manual para evitar UTC shift
        const [sy, sm, sd] = block.start_date.split('-').map(Number);
        const startDayIndex = new Date(sy, sm - 1, sd).getDay();
        const endBlockDate = block.end_date || block.start_date;
        const [eey, eem, eed] = endBlockDate.split('-').map(Number);
        const endDayIndex = new Date(eey, eem - 1, eed).getDay();

        // Si es el mismo día o rango de días
        const days = [];
        for (let i = startDayIndex; i <= endDayIndex; i++) {
          days.push(daysOfWeek[i]);
        }

        event.recurrence = [
          `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`
        ];
      }
    }

    // Crear evento en Google Calendar
    const result = await createCalendarEvent(
      accessToken,
      refreshToken,
      event
    );

    if (!result.success) {
      return result;
    }

    // Guardar el ID del evento en el bloqueo
    await supabase
      .from('availability_blocks')
      .update({ google_calendar_event_id: result.eventId })
      .eq('id', blockId);

    return {
      success: true,
      eventId: result.eventId,
      htmlLink: result.htmlLink,
    };
  } catch (error: unknown) {
    console.error('Error creating block in Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Eliminar un bloqueo de Google Calendar
 */
export async function deleteBlockFromGoogleCalendar(
  blockId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos del bloqueo
    const { data: block, error: blockError } = await supabase
      .from('availability_blocks')
      .select('google_calendar_event_id, professional_id')
      .eq('id', blockId)
      .single();

    if (blockError || !block) {
      return {
        success: false,
        error: 'No se pudo obtener el bloqueo',
      };
    }

    // Verificar que el usuario es el profesional de este bloqueo
    const { data: professional, error: profError } = await supabase
      .from('professional_applications')
      .select('user_id')
      .eq('id', block.professional_id)
      .single();

    if (profError || !professional || professional.user_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar este evento',
      };
    }

    // Verificar que el bloqueo tiene un evento de Google Calendar
    if (!block.google_calendar_event_id) {
      return {
        success: true,
        message: 'Este bloqueo no tiene un evento de Google Calendar asociado',
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
      block.google_calendar_event_id
    );

    if (result.success) {
      // Limpiar el ID del evento en el bloqueo
      await supabase
        .from('availability_blocks')
        .update({ google_calendar_event_id: null })
        .eq('id', blockId);
    }

    return result;
  } catch (error: unknown) {
    console.error('Error deleting block from Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Actualizar un bloqueo de disponibilidad en Google Calendar
 */
export async function updateBlockInGoogleCalendar(
  blockId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Obtener datos del bloqueo actualizado
    const { data: block, error: blockError } = await supabase
      .from('availability_blocks')
      .select('*, professional_id')
      .eq('id', blockId)
      .single();

    if (blockError || !block) {
      return {
        success: false,
        error: 'No se pudo obtener el bloqueo',
      };
    }

    // Verificar que el usuario es el profesional de este bloqueo
    const { data: professional, error: profError } = await supabase
      .from('professional_applications')
      .select('user_id')
      .eq('id', block.professional_id)
      .single();

    if (profError || !professional || professional.user_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para actualizar este evento',
      };
    }

    // Si no tiene evento de Google Calendar, crear uno nuevo
    if (!block.google_calendar_event_id) {
      return await createBlockInGoogleCalendar(blockId, userId);
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

    // Construir el evento actualizado según el tipo de bloqueo
    let eventUpdate: Partial<GoogleCalendarEvent>;

    if (block.block_type === 'full_day' || block.block_type === 'weekly_day') {
      // Bloqueo de día completo — usar fecha directa sin new Date() para evitar UTC shift
      const updBlockStartDate = block.start_date;
      const updEndDateStr = block.end_date || block.start_date;
      const [uey, uem, ued] = updEndDateStr.split('-').map(Number);
      const updEndDateObj = new Date(uey, uem - 1, ued + 1); // +1 día (exclusivo)
      const updBlockEndDate = `${updEndDateObj.getFullYear()}-${String(updEndDateObj.getMonth() + 1).padStart(2, '0')}-${String(updEndDateObj.getDate()).padStart(2, '0')}`;

      eventUpdate = {
        summary: block.title || 'Bloqueado',
        description: `Bloqueo de disponibilidad en Holistia${block.is_recurring ? ' (Recurrente)' : ''}`,
        start: {
          date: updBlockStartDate,
          timeZone: PLATFORM_TIMEZONE,
        },
        end: {
          date: updBlockEndDate,
          timeZone: PLATFORM_TIMEZONE,
        },
        transparency: 'opaque',
        colorId: '11',
      };

      // Para bloqueos recurrentes por día de semana
      if (block.is_recurring && block.day_of_week) {
        const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const dayIndex = block.day_of_week === 7 ? 0 : block.day_of_week;
        eventUpdate.recurrence = [
          `RRULE:FREQ=WEEKLY;BYDAY=${daysOfWeek[dayIndex]}`
        ];
      } else {
        eventUpdate.recurrence = undefined;
      }
    } else {
      // Bloqueo de rango de horas — timezone-safe sin toISOString()
      const updBlockStartTime = String(block.start_time).slice(0, 5);
      const updBlockEndTime = String(block.end_time).slice(0, 5);
      const updBlockStartDT = `${block.start_date}T${updBlockStartTime}:00`;
      const updBlockEndDT = `${block.start_date}T${updBlockEndTime}:00`;

      eventUpdate = {
        summary: block.title || 'Bloqueado',
        description: `Bloqueo de disponibilidad en Holistia${block.is_recurring ? ' (Recurrente)' : ''}`,
        start: {
          dateTime: updBlockStartDT,
          timeZone: PLATFORM_TIMEZONE,
        },
        end: {
          dateTime: updBlockEndDT,
          timeZone: PLATFORM_TIMEZONE,
        },
        transparency: 'opaque',
        colorId: '11',
      };

      // Para bloqueos recurrentes de rango de horas
      if (block.is_recurring && block.block_type === 'weekly_range') {
        const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const [usy, usm, usd] = block.start_date.split('-').map(Number);
        const startDayIndex = new Date(usy, usm - 1, usd).getDay();
        const updEndBlockDate = block.end_date || block.start_date;
        const [ueey, ueem, ueed] = updEndBlockDate.split('-').map(Number);
        const endDayIndex = new Date(ueey, ueem - 1, ueed).getDay();

        const days = [];
        for (let i = startDayIndex; i <= endDayIndex; i++) {
          days.push(daysOfWeek[i]);
        }

        eventUpdate.recurrence = [
          `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`
        ];
      } else {
        eventUpdate.recurrence = undefined;
      }
    }

    // Actualizar evento en Google Calendar
    const result = await updateCalendarEvent(
      accessToken,
      refreshToken,
      block.google_calendar_event_id,
      eventUpdate
    );

    return result;
  } catch (error: unknown) {
    console.error('Error updating block in Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Sincronizar todos los bloqueos actuales con Google Calendar
 */
export async function syncAllBlocksToGoogleCalendar(userId: string) {
  try {
    const supabase = await createClient();

    // Obtener el profesional
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .single();

    if (professionalError || !professional) {
      return {
        success: false,
        error: 'No se encontró un perfil de profesional aprobado',
      };
    }

    // Obtener todos los bloqueos que no tienen evento de Google Calendar
    const { data: blocks, error: blocksError } = await supabase
      .from('availability_blocks')
      .select('id')
      .eq('professional_id', professional.id)
      .is('google_calendar_event_id', null);

    if (blocksError) {
      return {
        success: false,
        error: 'Error al obtener bloqueos',
      };
    }

    if (!blocks || blocks.length === 0) {
      return {
        success: true,
        message: 'No hay bloqueos para sincronizar',
        syncedCount: 0,
      };
    }

    // Sincronizar cada bloqueo
    const results = await Promise.allSettled(
      blocks.map((block) =>
        createBlockInGoogleCalendar(block.id, userId)
      )
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    // Registrar timestamp de última sincronización exitosa
    if (successful > 0) {
      await supabase
        .from('profiles')
        .update({ google_calendar_last_synced_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return {
      success: true,
      message: `Se sincronizaron ${successful} de ${blocks.length} bloqueos`,
      syncedCount: successful,
      totalCount: blocks.length,
    };
  } catch (error: unknown) {
    console.error('Error syncing blocks to Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Sincronizar todas las citas futuras con Google Calendar
 */
export async function syncAllAppointmentsToGoogleCalendar(userId: string) {
  try {
    const supabase = await createClient();

    // Obtener todas las citas futuras del profesional que no tienen evento de Google
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .single();

    if (professionalError || !professional) {
      return {
        success: false,
        error: 'No se encontró un perfil de profesional aprobado',
      };
    }

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('professional_id', professional.id)
      .gte('appointment_date', (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })())
      .is('google_calendar_event_id', null)
      .in('status', ['confirmed', 'pending']);

    if (appointmentsError) {
      return {
        success: false,
        error: 'Error al obtener citas',
      };
    }

    if (!appointments || appointments.length === 0) {
      return {
        success: true,
        message: 'No hay citas para sincronizar',
        syncedCount: 0,
      };
    }

    // Sincronizar cada cita
    const results = await Promise.allSettled(
      appointments.map((appointment) =>
        createAppointmentInGoogleCalendar(appointment.id, userId)
      )
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    // Registrar timestamp de última sincronización exitosa
    if (successful > 0) {
      await supabase
        .from('profiles')
        .update({ google_calendar_last_synced_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return {
      success: true,
      message: `Se sincronizaron ${successful} de ${appointments.length} citas`,
      syncedCount: successful,
      totalCount: appointments.length,
    };
  } catch (error: unknown) {
    console.error('Error syncing appointments to Google Calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}
