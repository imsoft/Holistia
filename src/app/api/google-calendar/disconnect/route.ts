import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/google-calendar/disconnect
 * Desconecta la cuenta de Google Calendar del usuario
 */
export async function POST(request: NextRequest) {
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
