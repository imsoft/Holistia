import { google } from 'googleapis';

// Configuración de OAuth2
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Crea un cliente OAuth2 para Google Calendar
 */
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
}

/**
 * Genera la URL de autorización para conectar Google Calendar
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Fuerza el consent para obtener refresh token
  });

  return authUrl;
}

/**
 * Obtiene tokens de acceso usando el código de autorización
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Crea un cliente de Google Calendar autenticado
 */
export function getCalendarClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  return { calendar, oauth2Client };
}

/**
 * Refresca el access token usando el refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Tipos para eventos de Google Calendar
 */
export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  colorId?: string;
  transparency?: 'opaque' | 'transparent';
  recurrence?: string[];
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
}

/**
 * CRUD Operations para Google Calendar
 */

/**
 * Crea un evento en Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: GoogleCalendarEvent,
  calendarId: string = 'primary'
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: event.conferenceData ? 1 : undefined,
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      data: response.data,
    };
  } catch (error: unknown) {
    // Si el token expiró, intentar refrescarlo
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return createCalendarEvent(
          newCredentials.access_token,
          refreshToken,
          event,
          calendarId
        );
      }
    }

    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Obtiene un evento de Google Calendar
 */
export async function getCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  calendarId: string = 'primary'
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);

    const response = await calendar.events.get({
      calendarId,
      eventId,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return getCalendarEvent(
          newCredentials.access_token,
          refreshToken,
          eventId,
          calendarId
        );
      }
    }

    console.error('Error getting calendar event:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Lista eventos de Google Calendar
 */
export async function listCalendarEvents(
  accessToken: string,
  refreshToken: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
  } = {},
  calendarId: string = 'primary'
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);

    const response = await calendar.events.list({
      calendarId,
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax,
      maxResults: options.maxResults || 100,
      singleEvents: options.singleEvents !== false,
      orderBy: options.orderBy || 'startTime',
    });

    return {
      success: true,
      events: response.data.items || [],
    };
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return listCalendarEvents(
          newCredentials.access_token,
          refreshToken,
          options,
          calendarId
        );
      }
    }

    console.error('Error listing calendar events:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Obtiene la zona horaria del calendario (p.ej. primary).
 * Esto es clave para interpretar eventos cuando el item no trae start.timeZone/end.timeZone.
 */
export async function getCalendarTimeZone(
  accessToken: string,
  refreshToken: string,
  calendarId: string = 'primary'
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.calendars.get({ calendarId });

    return {
      success: true,
      timeZone: response.data.timeZone || 'America/Mexico_City',
    };
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return getCalendarTimeZone(newCredentials.access_token, refreshToken, calendarId);
      }
    }

    console.error('Error getting calendar timeZone:', error);
    return {
      success: false,
      timeZone: 'America/Mexico_City',
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Actualiza un evento en Google Calendar
 */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>,
  calendarId: string = 'primary'
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: event,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return updateCalendarEvent(
          newCredentials.access_token,
          refreshToken,
          eventId,
          event,
          calendarId
        );
      }
    }

    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  calendarId: string = 'primary'
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return {
      success: true,
    };
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return deleteCalendarEvent(
          newCredentials.access_token,
          refreshToken,
          eventId,
          calendarId
        );
      }
    }

    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Verifica si el usuario tiene acceso a Google Calendar
 */
export async function verifyCalendarAccess(
  accessToken: string,
  refreshToken: string
): Promise<boolean> {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);
    await calendar.calendarList.list();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Suscribirse a notificaciones de cambios en Google Calendar
 * Documentación: https://developers.google.com/calendar/api/guides/push
 */
export async function watchCalendar(
  accessToken: string,
  refreshToken: string,
  channelId: string,
  webhookUrl: string,
  calendarId: string = 'primary'
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);

    // La suscripción expira en máximo 7 días (604800 segundos)
    // Configuramos 6 días para renovar antes de que expire
    const expiration = Date.now() + (6 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        expiration: expiration.toString(),
      },
    });

    return {
      success: true,
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: response.data.expiration,
    };
  } catch (error: unknown) {
    // Si el token expiró, intentar refrescarlo
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return watchCalendar(
          newCredentials.access_token,
          refreshToken,
          channelId,
          webhookUrl,
          calendarId
        );
      }
    }

    console.error('Error watching calendar:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Detener la suscripción a notificaciones de Google Calendar
 */
export async function stopWatchingCalendar(
  accessToken: string,
  refreshToken: string,
  channelId: string,
  resourceId: string
) {
  try {
    const { calendar } = getCalendarClient(accessToken, refreshToken);

    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId,
      },
    });

    return {
      success: true,
    };
  } catch (error: unknown) {
    // Si el token expiró, intentar refrescarlo
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 401) {
      const newCredentials = await refreshAccessToken(refreshToken);
      if (newCredentials.access_token) {
        return stopWatchingCalendar(
          newCredentials.access_token,
          refreshToken,
          channelId,
          resourceId
        );
      }
    }

    console.error('Error stopping calendar watch:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}
