import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { verifyCalendarAccess } from '@/lib/google-calendar';

/**
 * GET /api/google-calendar/status
 * Verifica el estado de conexión con Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Obtener información de Google Calendar del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'google_calendar_connected, google_access_token, google_refresh_token, google_token_expires_at, google_calendar_last_synced_at'
      )
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Error al obtener perfil de usuario' },
        { status: 500 }
      );
    }

    // Si no está conectado, retornar estado básico
    if (!profile.google_calendar_connected) {
      return NextResponse.json({
        connected: false,
      });
    }

    // Verificar si el token está expirado
    const tokenExpired = profile.google_token_expires_at
      ? new Date(profile.google_token_expires_at) < new Date()
      : true;

    // Verificar acceso real a la API (opcional, puede ser lento)
    let hasAccess = false;
    if (
      profile.google_access_token &&
      profile.google_refresh_token &&
      !tokenExpired
    ) {
      hasAccess = await verifyCalendarAccess(
        profile.google_access_token,
        profile.google_refresh_token
      );
    }

    return NextResponse.json({
      connected: profile.google_calendar_connected,
      tokenExpired,
      hasAccess,
      expiresAt: profile.google_token_expires_at,
      lastSyncedAt: profile.google_calendar_last_synced_at,
    });
  } catch (error: unknown) {
    console.error('Error checking Google Calendar status:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
