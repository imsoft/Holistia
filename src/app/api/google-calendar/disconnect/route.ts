import { NextRequest, NextResponse } from 'next/server';
import { createClientForRequest } from '@/utils/supabase/api-auth';
import { stopWatchingCalendar } from '@/lib/google-calendar';

/**
 * POST /api/google-calendar/disconnect
 * Desconecta la cuenta de Google Calendar del usuario (web y app móvil con Bearer).
 * Cancela la suscripción de webhook en Google antes de limpiar tokens.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRequest(request);

    // Verificar que el usuario está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    // Obtener tokens y datos de webhook actuales antes de borrarlos
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_calendar_channel_id, google_calendar_resource_id')
      .eq('id', user.id)
      .single();

    // Cancelar webhook subscription en Google si existe
    if (
      profile?.google_access_token &&
      profile?.google_refresh_token &&
      profile?.google_calendar_channel_id &&
      profile?.google_calendar_resource_id
    ) {
      try {
        await stopWatchingCalendar(
          profile.google_access_token,
          profile.google_refresh_token,
          profile.google_calendar_channel_id,
          profile.google_calendar_resource_id
        );
        console.log('✅ Webhook de Google Calendar cancelado para:', user.id);
      } catch (webhookError) {
        // No falla la desconexión si esto falla; Google dejará de enviar después de la expiración
        console.warn('⚠️ No se pudo cancelar webhook de Google Calendar:', webhookError);
      }
    }

    // Llamar a la función de base de datos para limpiar los tokens
    const { error: disconnectError } = await supabase.rpc(
      'disconnect_google_calendar',
      { user_id: user.id }
    );

    if (disconnectError) {
      console.error('Error disconnecting Google Calendar:', disconnectError);
      return NextResponse.json(
        { 
          error: 'Error al desconectar Google Calendar',
          details: disconnectError.message || String(disconnectError)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google Calendar desconectado exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error in disconnect endpoint:', error);
    return NextResponse.json(
      { error: 'Error al desconectar', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
