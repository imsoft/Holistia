import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';
import { createClientForRequest, isMobileRequest } from '@/utils/supabase/api-auth';

/**
 * GET /api/google-calendar/auth
 * Inicia el flujo de OAuth2 para conectar Google Calendar
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

    // Guardar el user_id en state para recuperarlo en el callback (+ fromApp si viene de móvil)
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        fromApp: isMobileRequest(request),
      })
    ).toString('base64');

    // Generar la URL de autorización
    const authUrl = getAuthUrl();

    // Agregar el state a la URL
    const urlWithState = `${authUrl}&state=${state}`;

    return NextResponse.json({
      success: true,
      authUrl: urlWithState,
    });
  } catch (error: unknown) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json(
      { error: 'Error al generar URL de autenticación', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
