import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-calendar';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/google-calendar/callback
 * Callback de OAuth2 después de la autorización de Google
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Si el usuario rechazó el permiso
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=google_calendar_denied`,
          request.url
        )
      );
    }

    // Validar que tenemos el código
    if (!code) {
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=missing_code`,
          request.url
        )
      );
    }

    // Decodificar el state para obtener el userId
    let userId: string;
    try {
      const decodedState = JSON.parse(
        Buffer.from(state || '', 'base64').toString('utf-8')
      );
      userId = decodedState.userId;

      // Validar que el state no sea muy antiguo (más de 10 minutos)
      const timestamp = decodedState.timestamp;
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        throw new Error('State expirado');
      }
    } catch (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=invalid_state`,
          request.url
        )
      );
    }

    // Obtener los tokens de Google
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=missing_tokens`,
          request.url
        )
      );
    }

    // Guardar los tokens en Supabase
    const supabase = await createClient();

    // Calcular la fecha de expiración del token
    const expiresAt = new Date(
      Date.now() + (tokens.expiry_date || 3600 * 1000)
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_calendar_connected: true,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: expiresAt.toISOString(),
        google_calendar_id: 'primary',
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error saving Google tokens:', updateError);
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=save_tokens_failed`,
          request.url
        )
      );
    }

    // Redirigir al dashboard con mensaje de éxito
    return NextResponse.redirect(
      new URL(
        `/dashboard/professional/settings?success=google_calendar_connected`,
        request.url
      )
    );
  } catch (error: unknown) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=callback_failed&details=${encodeURIComponent((error instanceof Error ? error.message : String(error)))}`,
        request.url
      )
    );
  }
}
