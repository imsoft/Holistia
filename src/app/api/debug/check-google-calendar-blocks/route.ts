import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Endpoint de diagnóstico para verificar los bloqueos de Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener el parámetro de usuario desde query string
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId')?.trim();
    const professionalId = searchParams.get('professionalId')?.trim();

    if (!userId && !professionalId) {
      return NextResponse.json(
        { error: 'userId o professionalId es requerido' },
        { status: 400 }
      );
    }

    // Obtener el profesional (buscar por userId o professionalId)
    let professional;
    let profError;

    if (professionalId) {
      const result = await supabase
        .from('professional_applications')
        .select('id, user_id, first_name, last_name')
        .eq('id', professionalId)
        .eq('status', 'approved')
        .single();
      professional = result.data;
      profError = result.error;
    } else {
      const result = await supabase
        .from('professional_applications')
        .select('id, user_id, first_name, last_name')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();
      professional = result.data;
      profError = result.error;
    }

    if (profError || !professional) {
      return NextResponse.json({
        error: 'No se encontró profesional',
        details: profError
      }, { status: 404 });
    }

    // Obtener TODOS los bloqueos del profesional
    const { data: allBlocks, error: blocksError } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('professional_id', professional.id);

    if (blocksError) {
      return NextResponse.json({
        error: 'Error al obtener bloqueos',
        details: blocksError
      }, { status: 500 });
    }

    // Separar bloqueos externos e internos
    const externalBlocks = allBlocks?.filter(b => b.is_external_event === true) || [];
    const internalBlocks = allBlocks?.filter(b => !b.is_external_event) || [];

    // Verificar conexión de Google Calendar
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_connected, email')
      .eq('id', professional.user_id)
      .single();

    return NextResponse.json({
      professional: {
        id: professional.id,
        user_id: professional.user_id,
        name: `${professional.first_name} ${professional.last_name}`
      },
      googleCalendar: {
        connected: profile?.google_calendar_connected || false,
        email: profile?.email
      },
      blocks: {
        total: allBlocks?.length || 0,
        external: externalBlocks.length,
        internal: internalBlocks.length
      },
      externalBlocks: externalBlocks.map(b => ({
        id: b.id,
        title: b.title,
        block_type: b.block_type,
        start_date: b.start_date,
        end_date: b.end_date,
        start_time: b.start_time,
        end_time: b.end_time,
        is_recurring: b.is_recurring,
        google_calendar_event_id: b.google_calendar_event_id,
        external_event_source: b.external_event_source
      })),
      internalBlocks: internalBlocks.map(b => ({
        id: b.id,
        title: b.title,
        block_type: b.block_type,
        start_date: b.start_date,
        end_date: b.end_date,
        start_time: b.start_time,
        end_time: b.end_time,
        is_recurring: b.is_recurring
      }))
    });

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return NextResponse.json(
      {
        error: 'Error en diagnóstico',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
