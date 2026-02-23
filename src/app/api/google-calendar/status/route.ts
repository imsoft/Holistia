import { NextRequest, NextResponse } from 'next/server';
import { createClientForRequest } from '@/utils/supabase/api-auth';
import { verifyCalendarAccess, refreshAccessToken, calculateTokenExpiry } from '@/lib/google-calendar';

/**
 * GET /api/google-calendar/status
 * Verifica el estado de conexión con Google Calendar (web y app móvil con Bearer).
 */
export async function GET(request: NextRequest) {
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
    let tokenExpired = profile.google_token_expires_at
      ? new Date(profile.google_token_expires_at) < new Date()
      : true;

    let currentAccessToken = profile.google_access_token;

    // Si el token expiró, intentar refrescarlo automáticamente
    if (tokenExpired && profile.google_refresh_token) {
      try {
        const newCredentials = await refreshAccessToken(profile.google_refresh_token);
        if (newCredentials.access_token) {
          currentAccessToken = newCredentials.access_token;
          const expiresAt = calculateTokenExpiry(newCredentials.expiry_date);
          await supabase
            .from('profiles')
            .update({
              google_access_token: currentAccessToken,
              google_token_expires_at: expiresAt.toISOString(),
            })
            .eq('id', user.id);
          tokenExpired = false;
        }
      } catch (refreshError) {
        console.error('Error refreshing token in status check:', refreshError);
      }
    }

    // Verificar acceso real a la API
    let hasAccess = false;
    if (currentAccessToken && profile.google_refresh_token) {
      hasAccess = await verifyCalendarAccess(
        currentAccessToken,
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
