import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { syncGoogleCalendarEvents } from '@/actions/google-calendar/sync';

/**
 * Webhook para recibir notificaciones de cambios en Google Calendar
 *
 * Google Calendar envía notificaciones cuando hay cambios en el calendario
 * Documentación: https://developers.google.com/calendar/api/guides/push
 *
 * Estados de recurso (x-goog-resource-state):
 * - 'sync': Notificación inicial cuando se crea el canal (no hay cambios todavía)
 * - 'exists': Hay cambios en el recurso (evento creado, modificado, etc.)
 * - 'not_exists': El recurso fue eliminado
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
      timestamp: new Date().toISOString(),
    });

    // Validar que la notificación es de Google Calendar
    if (!channelId || !resourceId) {
      console.error('❌ Webhook inválido: faltan headers requeridos');
      return NextResponse.json(
        { error: 'Invalid webhook notification' },
        { status: 400 }
      );
    }

    // Usar after() de Next.js para procesar en background DESPUÉS de responder.
    // Esto es seguro en serverless (Vercel mantiene el proceso vivo hasta que after() termina).
    after(async () => {
      await processWebhookNotification(channelId, resourceId, resourceState);
    });

    // Responder inmediatamente a Google (deben recibir 200 OK en <10 segundos)
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error en webhook de Google Calendar:', error);
    // Siempre devolver 200 OK a Google para evitar reintentos
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

/**
 * Procesar notificación de webhook
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

    // Estados de Google Calendar Push Notifications:
    // - 'sync': Notificación inicial al crear el canal (NO hay cambios todavía)
    // - 'exists': HAY CAMBIOS en el recurso (evento creado, modificado, eliminado)
    // - 'not_exists': El recurso fue eliminado
    if (resourceState === 'sync') {
      console.log('ℹ️ Notificación inicial de sincronización - canal activo');
      return;
    }

    if (resourceState !== 'exists') {
      console.log('ℹ️ Estado del recurso no requiere sincronización:', resourceState);
      return;
    }

    console.log('🔄 Iniciando sincronización de eventos para:', profile.id);

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
export async function GET() {
  // Google puede enviar una solicitud GET para verificar la URL del webhook
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
