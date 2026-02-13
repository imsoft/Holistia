'use server';

import { createClient } from '@/utils/supabase/server';
import {
  listCalendarEvents,
  refreshAccessToken,
  calculateTokenExpiry,
  getCalendarTimeZone,
  watchCalendar,
  stopWatchingCalendar,
} from '@/lib/google-calendar';
import { randomUUID } from 'crypto';

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
      // expiry_date de Google es un timestamp absoluto (ms), NO una duración
      const expiresAt = calculateTokenExpiry(newCredentials.expiry_date);

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
 * Sincronizar eventos de Google Calendar y crear bloques de disponibilidad
 * para eventos que no son citas de Holistia
 */
export async function syncGoogleCalendarEvents(userId: string) {
  try {
    const supabase = await createClient();

    // Obtener el profesional
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id, user_id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .single();

    if (professionalError || !professional) {
      return {
        success: false,
        error: 'No se encontró un perfil de profesional aprobado',
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

    // Obtener calendarios seleccionados para sincronizar
    const { data: profileData } = await supabase
      .from('profiles')
      .select('google_calendars_selected')
      .eq('id', userId)
      .single();

    const selectedCalendars = (profileData?.google_calendars_selected || [
      { id: 'primary', summary: 'Primary', backgroundColor: null },
    ]) as Array<{ id: string; summary: string; backgroundColor?: string | null }>;

    if (selectedCalendars.length === 0) {
      return {
        success: false,
        error: 'No hay calendarios seleccionados para sincronizar',
      };
    }

    console.log(`📅 Sincronizando ${selectedCalendars.length} calendario(s):`,
      selectedCalendars.map(c => c.summary).join(', ')
    );

    // Obtener eventos de Google Calendar de los próximos 90 días (3 meses)
    // Esto asegura que capturemos suficientes eventos para mostrar bloqueos
    const timeMin = new Date().toISOString();
    const timeMax = new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Variables para acumular resultados de todos los calendarios
    const allEventsFromGoogle: Array<any> = [];
    let totalEventsFromGoogle = 0;

    // Iterar sobre cada calendario seleccionado
    for (const calendar of selectedCalendars) {
      const calendarId = calendar.id;

      console.log(`🔄 Procesando calendario: ${calendar.summary} (${calendarId})`);

      // Obtener eventos de este calendario
      const result = await listCalendarEvents(accessToken, refreshToken, {
        timeMin,
        timeMax,
        maxResults: 250, // Aumentar límite para capturar más eventos
        singleEvents: true,
        orderBy: 'startTime',
      }, calendarId); // IMPORTANTE: pasar calendarId específico

      if (!result.success) {
        console.error(`❌ Error al sincronizar calendario ${calendarId}:`,
          'error' in result ? result.error : 'Unknown error'
        );
        // Continuar con el siguiente calendario en lugar de fallar toda la sincronización
        continue;
      }

      if (!result.events) {
        console.warn(`⚠️ No se obtuvieron eventos del calendario ${calendarId}`);
        continue;
      }

      totalEventsFromGoogle += result.events.length;
      console.log(`📊 Calendario ${calendar.summary}: ${result.events.length} eventos obtenidos`);

      // Obtener timezone de este calendario específico
      const tzResult = await getCalendarTimeZone(accessToken, refreshToken, calendarId);
      const calendarTimeZone = tzResult.timeZone || 'America/Mexico_City';

      // Marcar eventos con su calendar source y timezone para usarlo después
      const eventsWithSource = result.events.map(event => ({
        ...event,
        _calendarSourceId: calendarId,
        _calendarTimeZone: calendarTimeZone,
      }));

      allEventsFromGoogle.push(...eventsWithSource);
    }

    // Si todos los calendarios fallaron, retornar error
    if (allEventsFromGoogle.length === 0 && selectedCalendars.length > 0) {
      return {
        success: false,
        error: 'No se pudieron sincronizar eventos de ningún calendario',
      };
    }

    // Usar el primer calendario como fallback para timezone (para compatibilidad con código existente)
    const primaryCalendarTimeZone = allEventsFromGoogle[0]?._calendarTimeZone || 'America/Mexico_City';

    // Helper: convertir Date a fecha/hora en la TZ del evento
    // IMPORTANTE: Debe estar definida ANTES de extractFromGoogleDateTime
    const formatInEventTimeZone = (date: Date, timeZone: string) => {
      const formatOptions: Intl.DateTimeFormatOptions = {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };

      const parts = new Intl.DateTimeFormat('en-CA', formatOptions).formatToParts(date);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      let hour = parts.find(p => p.type === 'hour')?.value;
      const minute = parts.find(p => p.type === 'minute')?.value;

      // Intl.DateTimeFormat puede devolver "24" para medianoche en algunos locales
      // Normalizamos a "00"
      if (hour === '24') {
        hour = '00';
      }

      // Log solo en caso de error o valores inesperados
      if (hour === '24' || !year || !month || !day || !hour || !minute) {
        console.warn('⚠️ formatInEventTimeZone: valores inesperados', {
          inputDate: date.toISOString(),
          targetTimeZone: timeZone,
          result: { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` }
        });
      }

      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}`,
      };
    };

    // Helper: extraer YYYY-MM-DD y HH:mm del RFC3339.
    // IMPORTANTE: Cuando el datetime tiene un offset (ej: 2025-01-27T17:00:00-06:00),
    // la hora local YA está en el string. NO debemos convertir usando Intl.DateTimeFormat
    // porque eso puede causar desfases por DST.
    //
    // Casos manejados:
    // 1. Con offset: "2025-01-27T17:00:00-06:00" -> extraer 17:00 directamente (es la hora local)
    // 2. UTC (Z): "2025-01-27T23:00:00Z" -> convertir de UTC a la timezone del evento
    // 3. Sin timezone: "2025-01-27T17:00:00" -> extraer directamente (ya es hora local)
    const extractFromGoogleDateTime = (dateTime: string, timeZone: string) => {
      // Caso 1: Datetime con offset (ej: -06:00, +05:30)
      // El offset indica la hora local, extraer directamente del string
      const offsetMatch = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?([+-]\d{2}:\d{2})$/.exec(dateTime);
      if (offsetMatch) {
        // La hora en el string YA es la hora local del evento
        return { date: offsetMatch[1], time: offsetMatch[2] };
      }

      // Caso 2: UTC (termina en Z)
      // Necesitamos convertir de UTC a la timezone del evento
      if (dateTime.endsWith('Z')) {
        const d = new Date(dateTime);
        const result = formatInEventTimeZone(d, timeZone);
        return result;
      }

      // Caso 3: Sin timezone info (ya es hora local)
      const localMatch = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(dateTime);
      if (localMatch) {
        return { date: localMatch[1], time: localMatch[2] };
      }

      // Fallback defensivo: usar Intl.DateTimeFormat
      console.warn('⚠️ extractFromGoogleDateTime: formato no reconocido, usando fallback', { dateTime, timeZone });
      const d = new Date(dateTime);
      const result = formatInEventTimeZone(d, timeZone);
      return result;
    };

    // Obtener todas las citas existentes de Holistia para este profesional
    const { data: appointments } = await supabase
      .from('appointments')
      .select('google_calendar_event_id')
      .eq('professional_id', professional.id)
      .not('google_calendar_event_id', 'is', null);

    const holistiaEventIds = new Set(
      appointments?.map(apt => apt.google_calendar_event_id) || []
    );

    // Obtener bloques externos existentes para evitar duplicados
    const { data: existingBlocks } = await supabase
      .from('availability_blocks')
      .select('id, google_calendar_event_id, calendar_source_id, start_date, start_time, end_time')
      .eq('professional_id', professional.id)
      .eq('is_external_event', true)
      .not('google_calendar_event_id', 'is', null);

    // Crear un Set con la combinación única de calendar_id + event_id + fecha + hora
    // IMPORTANTE: Incluir calendar_source_id para distinguir el mismo evento en diferentes calendarios
    // IMPORTANTE: Normalizar start_time/end_time a "HH:MM" (sin segundos) porque PostgreSQL
    // devuelve TIME como "HH:MM:SS" pero extractFromGoogleDateTime retorna "HH:MM".
    // Sin esta normalización, las keys no coinciden y los bloques se borran en cada sync.
    const normalizeTime = (t: string | null) => t ? t.substring(0, 5) : 'full_day';
    const existingBlockKeys = new Set(
      existingBlocks?.map(block =>
        `${block.calendar_source_id || 'primary'}_${block.google_calendar_event_id}_${block.start_date}_${normalizeTime(block.start_time)}_${normalizeTime(block.end_time)}`
      ) || []
    );

    // Filtrar eventos que no son de Holistia y que no están ya creados como bloques
    const externalEvents = allEventsFromGoogle.filter(event => {
      // Saltar eventos que no tienen ID
      if (!event.id) return false;

      // Saltar eventos que son citas de Holistia
      if (holistiaEventIds.has(event.id)) return false;

      // Saltar eventos que no tienen fecha/hora de inicio o fin
      if (!event.start || !event.end) return false;

      // Crear key única para este evento específico (maneja recurrencias)
      // IMPORTANTE: Incluir calendar_source_id para distinguir el mismo evento en diferentes calendarios
      const isAllDay = !!event.start?.date && !event.start?.dateTime;
      const calendarSourceId = event._calendarSourceId || 'primary';
      const eventTimeZone = event._calendarTimeZone || primaryCalendarTimeZone;
      let eventKey: string;

      if (isAllDay) {
        const startDate = event.start!.date!;
        eventKey = `${calendarSourceId}_${event.id}_${startDate}_full_day_full_day`;
      } else {
        // IMPORTANTE: la key debe usar la misma TZ que usamos al guardar el bloque,
        // si no, se desincroniza (especialmente en serverless/UTC).
        const start = extractFromGoogleDateTime(event.start!.dateTime!, eventTimeZone);
        const end = extractFromGoogleDateTime(event.end!.dateTime!, eventTimeZone);

        eventKey = `${calendarSourceId}_${event.id}_${start.date}_${start.time}_${end.time}`;
      }

      // Saltar eventos que ya están creados como bloques (por fecha y hora específica)
      if (existingBlockKeys.has(eventKey)) return false;

      return true;
    });

    console.log('📋 Eventos de Google Calendar:', {
      calendarsProcessed: selectedCalendars.length,
      totalFromGoogle: totalEventsFromGoogle,
      holistiaEvents: holistiaEventIds.size,
      existingBlocks: existingBlockKeys.size,
      afterFiltering: externalEvents.length
    });

    // Log detallado de eventos filtrados para debugging
    if (allEventsFromGoogle.length > 0 && externalEvents.length === 0) {
      console.log('⚠️ Se obtuvieron eventos pero todos fueron filtrados. Analizando razones:');
      allEventsFromGoogle.forEach((event, index) => {
        const reasons = [];
        if (!event.id) reasons.push('sin ID');
        if (holistiaEventIds.has(event.id)) reasons.push('es cita de Holistia');

        // Check if event key exists
        const isAllDay = !!event.start?.date && !event.start?.dateTime;
        let eventKey: string;
        if (isAllDay) {
          const startDate = event.start!.date!;
          eventKey = `${event.id}_${startDate}_full_day_full_day`;
      } else if (event.start?.dateTime && event.end?.dateTime) {
        const startDateTime = new Date(event.start.dateTime);
        const endDateTime = new Date(event.end.dateTime);
        const eventTimeZone = event.start.timeZone || 'America/Mexico_City';
        
        // Convertir a la zona horaria del evento
        const formatOptions: Intl.DateTimeFormatOptions = {
          timeZone: eventTimeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        };
        
        const startFormatted = new Intl.DateTimeFormat('en-CA', formatOptions).formatToParts(startDateTime);
        const endFormatted = new Intl.DateTimeFormat('en-CA', formatOptions).formatToParts(endDateTime);
        
        const startDate = `${startFormatted.find(p => p.type === 'year')?.value}-${startFormatted.find(p => p.type === 'month')?.value}-${startFormatted.find(p => p.type === 'day')?.value}`;
        const startTime = `${startFormatted.find(p => p.type === 'hour')?.value}:${startFormatted.find(p => p.type === 'minute')?.value}`;
        const endTime = `${endFormatted.find(p => p.type === 'hour')?.value}:${endFormatted.find(p => p.type === 'minute')?.value}`;
        eventKey = `${event.id}_${startDate}_${startTime}_${endTime}`;
        } else {
          eventKey = '';
        }

        if (eventKey && existingBlockKeys.has(eventKey)) reasons.push('ya existe como bloque');
        if (!event.start || !event.end) reasons.push('sin fecha/hora');

        console.log(`  Evento ${index + 1}: "${event.summary}" - Filtrado porque: ${reasons.join(', ')}`);
      });
    }

    // Crear bloques de disponibilidad para cada evento externo
    const blocksToCreate = externalEvents.map(event => {
      // Determinar si es un evento de día completo o de rango de horas
      const isAllDay = !!event.start?.date && !event.start?.dateTime;

      let blockData: {
        id?: string;
        professional_id: string;
        user_id: string;
        block_type: string;
        start_date: string;
        end_date?: string;
        start_time?: string;
        end_time?: string;
        title?: string;
        is_recurring: boolean;
        is_external_event: boolean;
        external_event_source: string;
        external_event_metadata: {
          summary?: string;
          description?: string;
          location?: string;
          htmlLink?: string;
        };
        google_calendar_event_id?: string;
        calendar_source_id?: string;
      };

      if (isAllDay) {
        // Evento de día completo
        const startDate = event.start!.date!;

        // Google Calendar devuelve la fecha de fin como exclusiva (día después del último día)
        // Por ejemplo: evento del 6 de diciembre -> start: "2025-12-06", end: "2025-12-07"
        // Debemos restar 1 día a la fecha de fin para obtener el último día real del evento
        let endDate = startDate; // Por defecto, mismo día
        if (event.end?.date) {
          // Parseo manual para evitar UTC shift con new Date(string)
          const [eY, eM, eD] = event.end.date.split('-').map(Number);
          const endDateObj = new Date(eY, eM - 1, eD - 1); // -1 día (Google usa exclusivo)
          endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
        }

        blockData = {
          id: randomUUID(),
          professional_id: professional.id,
          user_id: professional.user_id,
          block_type: 'full_day',
          start_date: startDate,
          end_date: endDate,
          title: event.summary || 'Evento bloqueado',
          is_recurring: !!event.recurrence && event.recurrence.length > 0,
          is_external_event: true,
          external_event_source: 'google_calendar',
          external_event_metadata: {
            summary: event.summary || undefined,
            description: event.description || undefined,
            location: event.location || undefined,
            htmlLink: event.htmlLink || undefined,
          },
          google_calendar_event_id: event.id || undefined,
          calendar_source_id: event._calendarSourceId || 'primary',
        };
      } else {
        // Evento con hora específica
        // IMPORTANTE: Google Calendar devuelve las fechas en ISO 8601 con timezone
        // Necesitamos convertir correctamente a la zona horaria del evento
        const eventTimeZone = event.start!.timeZone || primaryCalendarTimeZone;

        const start = extractFromGoogleDateTime(event.start!.dateTime!, eventTimeZone);
        const end = extractFromGoogleDateTime(event.end!.dateTime!, eventTimeZone);

        // Log para debugging de timezone
        console.log('📅 Procesando evento:', {
          summary: event.summary,
          googleStart: event.start!.dateTime,
          googleEnd: event.end!.dateTime,
          eventTimeZone,
          extractedStart: start,
          extractedEnd: end,
        });

        blockData = {
          id: randomUUID(),
          professional_id: professional.id,
          user_id: professional.user_id,
          block_type: 'time_range',
          start_date: start.date,
          end_date: end.date, // Soporta eventos que cruzan medianoche
          start_time: start.time,
          end_time: end.time,
          title: event.summary || 'Evento bloqueado',
          is_recurring: !!event.recurrence && event.recurrence.length > 0,
          is_external_event: true,
          external_event_source: 'google_calendar',
          external_event_metadata: {
            summary: event.summary || undefined,
            description: event.description || undefined,
            location: event.location || undefined,
            htmlLink: event.htmlLink || undefined,
          },
          google_calendar_event_id: event.id || undefined,
          calendar_source_id: event._calendarSourceId || 'primary',
        };
      }

      return blockData;
    });

    // Insertar bloques en la base de datos usando INSERT ... ON CONFLICT DO NOTHING
    // Esto ignora duplicados automáticamente en lugar de fallar
    if (blocksToCreate.length > 0) {
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const block of blocksToCreate) {
        const { error: insertError } = await supabase
          .from('availability_blocks')
          .insert(block);

        if (insertError) {
          // Si es error de clave duplicada, es esperado (el evento ya existe)
          if (insertError.code === '23505') {
            skipCount++;
            console.log(`⏭️ Bloque duplicado ignorado: "${block.title}" (${block.start_date} ${block.start_time || 'todo el día'})`);
          } else {
            errorCount++;
            console.error('Error al insertar bloque:', insertError, 'Block:', block);
            errors.push(`${insertError.code}: ${insertError.message}`);
          }
        } else {
          successCount++;
        }
      }

      console.log(`📊 Inserción completada: ${successCount} creados, ${skipCount} duplicados ignorados, ${errorCount} errores`);

      // Si todos fallaron con errores reales (no duplicados), retornar error
      if (errorCount > 0 && successCount === 0) {
        return {
          success: false,
          error: `Error al crear bloques de disponibilidad. Detalles: ${errors[0] || 'Error desconocido'}`,
        };
      }

      // Si algunos fallaron con errores reales, logear advertencia
      if (errorCount > 0) {
        console.warn(`⚠️ Se crearon ${successCount} bloques pero ${errorCount} fallaron:`, errors);
      }
    }

    // Eliminar bloques externos que ya no existen en Google Calendar
    // Crear un Set de keys actuales de eventos de Google (de TODOS los calendarios)
    const currentGoogleEventKeys = new Set<string>();
    allEventsFromGoogle.forEach(event => {
      if (!event.id || !event.start || !event.end) return;

      const isAllDay = !!event.start?.date && !event.start?.dateTime;
      const calendarSourceId = event._calendarSourceId || 'primary';
      const eventTimeZone = event._calendarTimeZone || primaryCalendarTimeZone;

      if (isAllDay) {
        const startDate = event.start.date!;
        currentGoogleEventKeys.add(`${calendarSourceId}_${event.id}_${startDate}_full_day_full_day`);
      } else {
        const start = extractFromGoogleDateTime(event.start.dateTime!, eventTimeZone);
        const end = extractFromGoogleDateTime(event.end.dateTime!, eventTimeZone);
        currentGoogleEventKeys.add(`${calendarSourceId}_${event.id}_${start.date}_${start.time}_${end.time}`);
      }
    });

    // Encontrar bloques que ya no existen en Google Calendar
    // IMPORTANTE: Usar normalizeTime() para que las keys coincidan (DB devuelve "HH:MM:SS")
    const blocksToDeleteIds: string[] = [];
    if (existingBlocks) {
      existingBlocks.forEach(block => {
        const calendarSourceId = block.calendar_source_id || 'primary';
        const blockKey = `${calendarSourceId}_${block.google_calendar_event_id}_${block.start_date}_${normalizeTime(block.start_time)}_${normalizeTime(block.end_time)}`;
        if (!currentGoogleEventKeys.has(blockKey)) {
          // Importante: borrar por ID del bloque (no por google_calendar_event_id),
          // para no eliminar también bloques recién insertados en este mismo sync.
          if (block.id) blocksToDeleteIds.push(block.id);
        }
      });
    }

    if (blocksToDeleteIds.length > 0) {
      await supabase
        .from('availability_blocks')
        .delete()
        .eq('professional_id', professional.id)
        .eq('is_external_event', true)
        .in('id', blocksToDeleteIds);
    }

    // Registrar timestamp de última sincronización exitosa
    await supabase
      .from('profiles')
      .update({ google_calendar_last_synced_at: new Date().toISOString() })
      .eq('id', userId);

    return {
      success: true,
      message: `Sincronización completada: ${blocksToCreate.length} eventos nuevos de ${selectedCalendars.length} calendario(s), ${blocksToDeleteIds.length} eventos eliminados`,
      created: blocksToCreate.length,
      deleted: blocksToDeleteIds.length,
      diagnostics: {
        calendarsProcessed: selectedCalendars.length,
        totalFromGoogle: totalEventsFromGoogle,
        holistiaEvents: holistiaEventIds.size,
        existingBlocks: existingBlockKeys.size,
        afterFiltering: externalEvents.length,
      }
    };
  } catch (error: unknown) {
    console.error('Error syncing Google Calendar events:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Eliminar todos los bloques externos de Google Calendar para un profesional
 */
export async function clearExternalGoogleCalendarBlocks(userId: string) {
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

    // Eliminar todos los bloques externos
    const { error: deleteError } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('professional_id', professional.id)
      .eq('is_external_event', true);

    if (deleteError) {
      return {
        success: false,
        error: 'Error al eliminar bloques externos',
      };
    }

    return {
      success: true,
      message: 'Bloques externos eliminados correctamente',
    };
  } catch (error: unknown) {
    console.error('Error clearing external blocks:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Suscribirse a notificaciones de Google Calendar
 */
export async function subscribeToCalendarNotifications(userId: string) {
  try {
    const supabase = await createClient();

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

    // Generar un ID único para el canal de notificaciones
    const channelId = `holistia-${userId}-${randomUUID()}`;

    // URL del webhook (debe ser HTTPS en producción)
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/google-calendar/webhook`;

    // Suscribirse a notificaciones
    const result = await watchCalendar(
      accessToken,
      refreshToken,
      channelId,
      webhookUrl
    );

    if (!result.success) {
      return result;
    }

    // Guardar información de la suscripción en la base de datos
    const expiration = result.expiration
      ? new Date(parseInt(result.expiration))
      : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);

    await supabase
      .from('profiles')
      .update({
        google_calendar_channel_id: result.channelId,
        google_calendar_resource_id: result.resourceId,
        google_calendar_webhook_expiration: expiration.toISOString(),
      })
      .eq('id', userId);

    return {
      success: true,
      message: 'Suscripción a notificaciones configurada correctamente',
      channelId: result.channelId,
      expiration: expiration.toISOString(),
    };
  } catch (error: unknown) {
    console.error('Error subscribing to calendar notifications:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Cancelar suscripción a notificaciones de Google Calendar
 */
export async function unsubscribeFromCalendarNotifications(userId: string) {
  try {
    const supabase = await createClient();

    // Obtener información de la suscripción actual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_channel_id, google_calendar_resource_id, google_access_token, google_refresh_token')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'No se pudo obtener el perfil del usuario',
      };
    }

    if (!profile.google_calendar_channel_id || !profile.google_calendar_resource_id) {
      return {
        success: true,
        message: 'No hay suscripción activa',
      };
    }

    if (!profile.google_access_token || !profile.google_refresh_token) {
      // Limpiar datos de suscripción aunque no podamos cancelarla en Google
      await supabase
        .from('profiles')
        .update({
          google_calendar_channel_id: null,
          google_calendar_resource_id: null,
          google_calendar_webhook_expiration: null,
        })
        .eq('id', userId);

      return {
        success: true,
        message: 'Datos de suscripción eliminados localmente',
      };
    }

    // Cancelar suscripción en Google Calendar
    const result = await stopWatchingCalendar(
      profile.google_access_token,
      profile.google_refresh_token,
      profile.google_calendar_channel_id,
      profile.google_calendar_resource_id
    );

    // Limpiar datos de suscripción en la base de datos
    await supabase
      .from('profiles')
      .update({
        google_calendar_channel_id: null,
        google_calendar_resource_id: null,
        google_calendar_webhook_expiration: null,
      })
      .eq('id', userId);

    if (result.success) {
      return {
        success: true,
        message: 'Suscripción cancelada correctamente',
      };
    } else {
      return {
        success: true,
        message: 'Datos de suscripción eliminados (puede haber error en Google)',
        warning: result.error,
      };
    }
  } catch (error: unknown) {
    console.error('Error unsubscribing from calendar notifications:', error);
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
    };
  }
}
