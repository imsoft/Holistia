import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { syncGoogleCalendarEvents } from '@/actions/google-calendar/sync';

/**
 * Endpoint de admin para forzar la sincronización de Google Calendar
 * y ver logs detallados del proceso
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar que es admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (adminProfile?.type !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { professionalId, clearFirst } = body as {
      professionalId?: string;
      clearFirst?: boolean;
    };

    if (!professionalId) {
      return NextResponse.json(
        { error: 'professionalId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔵 [Admin Force Sync] Iniciando sincronización forzada para professional:', professionalId);

    // Obtener el profesional y su user_id
    const { data: professional, error: profError } = await supabase
      .from('professional_applications')
      .select('id, user_id, first_name, last_name')
      .eq('id', professionalId)
      .eq('status', 'approved')
      .single();

    if (profError || !professional) {
      console.error('❌ [Admin Force Sync] No se encontró profesional:', profError);
      return NextResponse.json(
        { error: 'No se encontró profesional aprobado', details: profError },
        { status: 404 }
      );
    }

    console.log('✅ [Admin Force Sync] Profesional encontrado:', {
      id: professional.id,
      user_id: professional.user_id,
      name: `${professional.first_name} ${professional.last_name}`
    });

    // Verificar Google Calendar conectado
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_connected, email, google_access_token, google_refresh_token')
      .eq('id', professional.user_id)
      .single();

    if (!profile?.google_calendar_connected) {
      console.log('⚠️ [Admin Force Sync] Google Calendar no conectado');
      return NextResponse.json(
        {
          error: 'Google Calendar no está conectado para este profesional',
          professional: {
            id: professional.id,
            name: `${professional.first_name} ${professional.last_name}`,
            email: profile?.email
          }
        },
        { status: 400 }
      );
    }

    console.log('✅ [Admin Force Sync] Google Calendar conectado para:', profile.email);

    // Obtener bloques actuales antes de la sincronización
    const { data: blocksBefore } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('professional_id', professional.id)
      .eq('is_external_event', true);

    console.log('📊 [Admin Force Sync] Bloques externos antes de sync:', blocksBefore?.length || 0);

    let cleared = 0;
    if (clearFirst) {
      console.log('🧹 [Admin Force Sync] clearFirst=true → borrando bloques externos antes de sincronizar...');
      const { error: clearError, count } = await supabase
        .from('availability_blocks')
        .delete({ count: 'exact' })
        .eq('professional_id', professional.id)
        .eq('is_external_event', true);

      if (clearError) {
        console.error('❌ [Admin Force Sync] Error borrando bloques externos:', clearError);
        return NextResponse.json(
          { error: 'Error al borrar bloques externos', details: clearError },
          { status: 500 }
        );
      }

      cleared = count || 0;
      console.log('✅ [Admin Force Sync] Bloques externos borrados:', cleared);
    }

    // Ejecutar la sincronización
    console.log('🔄 [Admin Force Sync] Ejecutando syncGoogleCalendarEvents...');
    const syncResult = await syncGoogleCalendarEvents(professional.user_id);

    console.log('📋 [Admin Force Sync] Resultado de sincronización:', syncResult);

    // Obtener bloques después de la sincronización
    const { data: blocksAfter } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('professional_id', professional.id)
      .eq('is_external_event', true);

    console.log('📊 [Admin Force Sync] Bloques externos después de sync:', blocksAfter?.length || 0);

    return NextResponse.json({
      success: syncResult.success,
      professional: {
        id: professional.id,
        user_id: professional.user_id,
        name: `${professional.first_name} ${professional.last_name}`,
        email: profile.email
      },
      syncResult: {
        message: syncResult.message,
        created: syncResult.created || 0,
        deleted: syncResult.deleted || 0,
        error: syncResult.error
      },
      blocks: {
        before: blocksBefore?.length || 0,
        cleared,
        after: blocksAfter?.length || 0,
        difference: (blocksAfter?.length || 0) - (blocksBefore?.length || 0)
      },
      externalBlocks: blocksAfter?.map(b => ({
        id: b.id,
        title: b.title,
        block_type: b.block_type,
        start_date: b.start_date,
        end_date: b.end_date,
        start_time: b.start_time,
        end_time: b.end_time,
        google_calendar_event_id: b.google_calendar_event_id,
        created_at: b.created_at
      }))
    });

  } catch (error) {
    console.error('❌ [Admin Force Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Error al forzar sincronización',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
