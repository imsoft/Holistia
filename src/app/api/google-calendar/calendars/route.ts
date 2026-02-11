import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { listCalendars } from '@/lib/google-calendar';

/**
 * GET /api/google-calendar/calendars
 * Obtiene la lista de calendarios disponibles y los seleccionados por el usuario
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
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

    // Obtener datos de Google Calendar del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'google_calendar_connected, google_access_token, google_refresh_token, google_calendars_selected'
      )
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Error al obtener perfil de usuario' },
        { status: 500 }
      );
    }

    if (!profile.google_calendar_connected) {
      return NextResponse.json(
        { error: 'Google Calendar no está conectado' },
        { status: 400 }
      );
    }

    if (!profile.google_access_token || !profile.google_refresh_token) {
      return NextResponse.json(
        { error: 'Tokens de Google Calendar no disponibles' },
        { status: 400 }
      );
    }

    // Obtener lista de calendarios de Google
    const result = await listCalendars(
      profile.google_access_token,
      profile.google_refresh_token
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'error' in result ? result.error : 'Error al obtener calendarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: result.calendars,
      selected: profile.google_calendars_selected || [
        { id: 'primary', summary: 'Primary', backgroundColor: null },
      ],
    });
  } catch (error: unknown) {
    console.error('Error fetching Google calendars:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener calendarios',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/google-calendar/calendars
 * Actualiza los calendarios seleccionados por el usuario
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
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

    // Parsear body
    const body = await request.json();
    const { calendars } = body;

    if (!Array.isArray(calendars)) {
      return NextResponse.json(
        { error: 'El campo "calendars" debe ser un array' },
        { status: 400 }
      );
    }

    // Validar formato
    const isValid = calendars.every(
      (cal) =>
        typeof cal === 'object' &&
        typeof cal.id === 'string' &&
        typeof cal.summary === 'string'
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Formato de calendarios inválido' },
        { status: 400 }
      );
    }

    // Validar que haya al menos un calendario seleccionado
    if (calendars.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un calendario' },
        { status: 400 }
      );
    }

    // Actualizar en base de datos
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_calendars_selected: calendars,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating calendars selection:', updateError);
      return NextResponse.json(
        { error: 'Error al guardar selección de calendarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendarios actualizados correctamente',
    });
  } catch (error: unknown) {
    console.error('Error updating Google calendars selection:', error);
    return NextResponse.json(
      {
        error: 'Error al actualizar calendarios',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
