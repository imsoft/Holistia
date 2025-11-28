import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { syncGoogleCalendarEvents } from '@/actions/google-calendar/sync';

/**
 * Webhook para recibir notificaciones de cambios en Google Calendar
 *
 * Google Calendar envía notificaciones cuando hay cambios en el calendario
 * Documentación: https://developers.google.com/calendar/api/guides/push
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener headers de la notificación de Google
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const messageNumber = request.headers.get('x-goog-message-number');

    console.log('📨 Webhook de Google Calendar recibido:', {
      channelId,
      resourceId,
      resourceState,
      messageNumber,
    });

    // Validar que la notificación es de Google Calendar
    if (!channelId || !resourceId) {
      console.error('❌ Webhook inválido: faltan headers requeridos');
      return NextResponse.json(
        { error: 'Invalid webhook notification' },
        { status: 400 }
      );
    }

    // Responder inmediatamente a Google (deben recibir 200 OK rápidamente)
    // Procesaremos la sincronización de forma asíncrona
    const response = NextResponse.json({ received: true }, { status: 200 });

    // Procesar la notificación de forma asíncrona
    // No esperamos a que termine para no bloquear la respuesta a Google
    processWebhookNotification(channelId, resourceId, resourceState).catch(error => {
      console.error('Error procesando notificación de webhook:', error);
    });

    return response;
  } catch (error) {
    console.error('Error en webhook de Google Calendar:', error);
    // Siempre devolver 200 OK a Google para evitar reintentos
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

/**
 * Procesar notificación de webhook de forma asíncrona
 */
async function processWebhookNotification(
  channelId: string,
  resourceId: string,
  resourceState: string | null
) {
  try {
    const supabase = await createClient();

    // Buscar el usuario asociado a este canal de notificaciones
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('google_calendar_channel_id', channelId)
      .eq('google_calendar_resource_id', resourceId)
      .single();

    if (error || !profile) {
      console.error('❌ No se encontró perfil para este canal:', { channelId, resourceId });
      return;
    }

    console.log('✅ Perfil encontrado para canal:', profile.id);

    // Solo sincronizar si el estado es 'sync' (hay cambios)
    // 'exists' es solo para verificar que el canal está activo
    if (resourceState !== 'sync') {
      console.log('ℹ️ Estado del recurso no requiere sincronización:', resourceState);
      return;
    }

    console.log('🔄 Iniciando sincronización de eventos...');

    // Sincronizar eventos de Google Calendar
    const result = await syncGoogleCalendarEvents(profile.id);

    if (result.success) {
      console.log('✅ Sincronización completada:', result.message);
    } else {
      console.error('❌ Error en sincronización:', result.error);
    }
  } catch (error) {
    console.error('Error procesando notificación:', error);
  }
}

/**
 * Verificación del webhook (usado por Google para verificar la URL)
 */
export async function GET(request: NextRequest) {
  // Google puede enviar una solicitud GET para verificar la URL del webhook
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
