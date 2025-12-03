'use server';

import { createClient } from '@/utils/supabase/server';
import {
  listCalendarEvents,
  refreshAccessToken,
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

    // Obtener eventos de Google Calendar de los próximos 30 días
    const timeMin = new Date().toISOString();
    const timeMax = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = await listCalendarEvents(accessToken, refreshToken, {
      timeMin,
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (!result.success || !result.events) {
      return {
        success: false,
        error: result.error || 'Error al obtener eventos de Google Calendar',
      };
    }

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
      .select('google_calendar_event_id')
      .eq('professional_id', professional.id)
      .eq('is_external_event', true)
      .not('google_calendar_event_id', 'is', null);

    const existingBlockIds = new Set(
      existingBlocks?.map(block => block.google_calendar_event_id) || []
    );

    // Filtrar eventos que no son de Holistia y que no están ya creados como bloques
    const externalEvents = result.events.filter(event => {
      // Saltar eventos que no tienen ID
      if (!event.id) return false;

      // Saltar eventos que son citas de Holistia
      if (holistiaEventIds.has(event.id)) return false;

      // Saltar eventos que ya están creados como bloques
      if (existingBlockIds.has(event.id)) return false;

      // Saltar eventos que no tienen fecha/hora de inicio o fin
      if (!event.start || !event.end) return false;

      // Saltar eventos transparentes (disponibles en el calendario)
      if (event.transparency === 'transparent') return false;

      return true;
    });

    console.log('📋 Eventos externos encontrados:', {
      total: result.events.length,
      holistiaEvents: holistiaEventIds.size,
      existingBlocks: existingBlockIds.size,
      newExternalEvents: externalEvents.length
    });

    // Crear bloques de disponibilidad para cada evento externo
    const blocksToCreate = externalEvents.map(event => {
      // Determinar si es un evento de día completo o de rango de horas
      const isAllDay = !!event.start?.date && !event.start?.dateTime;

      let blockData: {
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
      };

      if (isAllDay) {
        // Evento de día completo
        const startDate = event.start!.date!;
        const endDate = event.end?.date || startDate;

        blockData = {
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
        };
      } else {
        // Evento con hora específica
        const startDateTime = new Date(event.start!.dateTime!);
        const endDateTime = new Date(event.end!.dateTime!);

        // Formatear fecha y hora
        const startDate = startDateTime.toISOString().split('T')[0];
        const startTime = startDateTime.toTimeString().substring(0, 5);
        const endTime = endDateTime.toTimeString().substring(0, 5);

        blockData = {
          professional_id: professional.id,
          user_id: professional.user_id,
          block_type: 'time_range',
          start_date: startDate,
          start_time: startTime,
          end_time: endTime,
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
        };
      }

      return blockData;
    });

    // Insertar bloques en la base de datos
    if (blocksToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('availability_blocks')
        .insert(blocksToCreate);

      if (insertError) {
        console.error('Error al insertar bloques:', insertError);
        return {
          success: false,
          error: 'Error al crear bloques de disponibilidad',
        };
      }
    }

    // Eliminar bloques externos que ya no existen en Google Calendar
    const currentGoogleEventIds = new Set(
      result.events.map(event => event.id).filter(Boolean)
    );

    const blocksToDelete = Array.from(existingBlockIds).filter(
      id => !currentGoogleEventIds.has(id)
    );

    if (blocksToDelete.length > 0) {
      await supabase
        .from('availability_blocks')
        .delete()
        .eq('professional_id', professional.id)
        .eq('is_external_event', true)
        .in('google_calendar_event_id', blocksToDelete);
    }

    return {
      success: true,
      message: `Sincronización completada: ${blocksToCreate.length} eventos nuevos, ${blocksToDelete.length} eventos eliminados`,
      created: blocksToCreate.length,
      deleted: blocksToDelete.length,
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
