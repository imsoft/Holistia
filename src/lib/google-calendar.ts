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
 * Refresca el access token usando el refresh token.
 * IMPORTANTE: expiry_date de Google es un TIMESTAMP ABSOLUTO (ms desde epoch),
 * NO una duración.
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
 * Calcula correctamente la fecha de expiración del token.
 * expiry_date de Google es un TIMESTAMP ABSOLUTO (ms desde epoch).
 * Si no viene, asumimos 1 hora desde ahora.
 */
export function calculateTokenExpiry(expiryDate: number | null | undefined): Date {
  if (expiryDate && expiryDate > Date.now() / 2) {
    // Es un timestamp absoluto (ej: 1738000000000)
    return new Date(expiryDate);
  }
  // Fallback: 55 minutos desde ahora (un poco antes de 1h para refrescar proactivamente)
  return new Date(Date.now() + 55 * 60 * 1000);
}

/**
 * Persiste el access token refrescado en la base de datos.
 * Se usa desde las funciones CRUD cuando se refresca automáticamente.
 */
async function persistRefreshedToken(
  accessToken: string,
  refreshToken: string,
  expiryDate: number | null | undefined
) {
  try {
    // Importación dinámica para evitar ciclos (solo se usa server-side)
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    // Buscar el usuario por refresh token
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('google_refresh_token', refreshToken)
      .single();

    if (profile?.id) {
      const expiresAt = calculateTokenExpiry(expiryDate);
      await supabase
        .from('profiles')
        .update({
          google_access_token: accessToken,
          google_token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', profile.id);
    }
  } catch (err) {
    // No fallar la operación principal si persistir falla
    console.error('Error persisting refreshed token to DB:', err);
  }
}

/**
 * Helper que maneja el retry con refresh de token.
 * - Máximo 1 reintento (evita recursión infinita)
 * - Persiste el token refrescado en la BD
 */
async function withTokenRefresh<T>(
  accessToken: string,
  refreshToken: string,
  operation: (token: string) => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation(accessToken);
  } catch (error: unknown) {
    const isAuthError =
      error instanceof Error &&
      'code' in error &&
      (error as { code?: number }).code === 401;

    if (isAuthError && refreshToken) {
      console.log(`🔄 Token expirado en ${operationName}, refrescando...`);
      try {
        const newCredentials = await refreshAccessToken(refreshToken);
        if (newCredentials.access_token) {
          // Persistir el nuevo token en la BD
          await persistRefreshedToken(
            newCredentials.access_token,
            refreshToken,
            newCredentials.expiry_date
          );
          // Reintentar UNA sola vez con el nuevo token (sin más recursión)
          return await operation(newCredentials.access_token);
        }
      } catch (refreshError) {
        console.error(`Error refrescando token en ${operationName}:`, refreshError);
      }
    }

    throw error;
  }
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
 * Todas usan withTokenRefresh para manejar tokens expirados sin recursión infinita.
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
    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        const response = await calendar.events.insert({
          calendarId,
          requestBody: event,
          conferenceDataVersion: event.conferenceData ? 1 : undefined,
        });
        return {
          success: true as const,
          eventId: response.data.id,
          htmlLink: response.data.htmlLink,
          data: response.data,
        };
      },
      'createCalendarEvent'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error creating calendar event:', error);
    return {
      success: false as const,
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
    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        const response = await calendar.events.get({
          calendarId,
          eventId,
        });
        return { success: true as const, data: response.data };
      },
      'getCalendarEvent'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error getting calendar event:', error);
    return {
      success: false as const,
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
    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        const response = await calendar.events.list({
          calendarId,
          timeMin: options.timeMin || new Date().toISOString(),
          timeMax: options.timeMax,
          maxResults: options.maxResults || 100,
          singleEvents: options.singleEvents !== false,
          orderBy: options.orderBy || 'startTime',
        });
        return { success: true as const, events: response.data.items || [] };
      },
      'listCalendarEvents'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error listing calendar events:', error);
    return {
      success: false as const,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Obtiene la zona horaria del calendario (p.ej. primary).
 */
export async function getCalendarTimeZone(
  accessToken: string,
  refreshToken: string,
  calendarId: string = 'primary'
) {
  try {
    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        const response = await calendar.calendars.get({ calendarId });
        return {
          success: true as const,
          timeZone: response.data.timeZone || 'America/Mexico_City',
        };
      },
      'getCalendarTimeZone'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error getting calendar timeZone:', error);
    return {
      success: false as const,
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
    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        const response = await calendar.events.patch({
          calendarId,
          eventId,
          requestBody: event,
        });
        return { success: true as const, data: response.data };
      },
      'updateCalendarEvent'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error updating calendar event:', error);
    return {
      success: false as const,
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
    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        await calendar.events.delete({ calendarId, eventId });
        return { success: true as const };
      },
      'deleteCalendarEvent'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false as const,
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
    await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        await calendar.calendarList.list();
        return true;
      },
      'verifyCalendarAccess'
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Suscribirse a notificaciones de cambios en Google Calendar
 */
export async function watchCalendar(
  accessToken: string,
  refreshToken: string,
  channelId: string,
  webhookUrl: string,
  calendarId: string = 'primary'
) {
  try {
    // La suscripción expira en máximo 7 días (604800 segundos)
    // Configuramos 6 días para renovar antes de que expire
    const expiration = Date.now() + (6 * 24 * 60 * 60 * 1000);

    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
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
          success: true as const,
          channelId: response.data.id,
          resourceId: response.data.resourceId,
          expiration: response.data.expiration,
        };
      },
      'watchCalendar'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error watching calendar:', error);
    return {
      success: false as const,
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
    const result = await withTokenRefresh(
      accessToken,
      refreshToken,
      async (token) => {
        const { calendar } = getCalendarClient(token, refreshToken);
        await calendar.channels.stop({
          requestBody: { id: channelId, resourceId },
        });
        return { success: true as const };
      },
      'stopWatchingCalendar'
    );
    return result;
  } catch (error: unknown) {
    console.error('Error stopping calendar watch:', error);
    return {
      success: false as const,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}
