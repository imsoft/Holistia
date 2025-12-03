import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Endpoint para limpiar bloques duplicados de Google Calendar
 * Los bloques duplicados tienen el mismo google_calendar_event_id, start_date, start_time, end_time
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

    const body = await request.json();
    const { professionalId } = body;

    if (!professionalId) {
      return NextResponse.json(
        { error: 'professionalId es requerido' },
        { status: 400 }
      );
    }

    console.log('🧹 [Clean Duplicates] Iniciando limpieza de duplicados para professional:', professionalId);

    // Obtener todos los bloques externos del profesional
    const { data: blocks, error: blocksError } = await supabase
      .from('availability_blocks')
      .select('id, google_calendar_event_id, start_date, start_time, end_time, created_at')
      .eq('professional_id', professionalId)
      .eq('is_external_event', true)
      .not('google_calendar_event_id', 'is', null)
      .order('created_at', { ascending: true }); // Más antiguos primero

    if (blocksError) {
      console.error('❌ Error al obtener bloques:', blocksError);
      return NextResponse.json(
        { error: 'Error al obtener bloques', details: blocksError },
        { status: 500 }
      );
    }

    if (!blocks || blocks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay bloques externos para limpiar',
        duplicatesRemoved: 0,
        totalBlocks: 0
      });
    }

    console.log(`📊 Total de bloques externos: ${blocks.length}`);

    // Agrupar por key única (event_id + fecha + hora)
    const seenKeys = new Map<string, string>(); // key -> id del primer bloque
    const duplicateIds: string[] = [];

    blocks.forEach(block => {
      const key = `${block.google_calendar_event_id}_${block.start_date}_${block.start_time || 'full_day'}_${block.end_time || 'full_day'}`;

      if (seenKeys.has(key)) {
        // Este es un duplicado, agregar a la lista de eliminación
        duplicateIds.push(block.id);
        console.log(`🔍 Duplicado encontrado: ${key}`);
        console.log(`   - Manteniendo: ${seenKeys.get(key)} (creado: ${blocks.find(b => b.id === seenKeys.get(key))?.created_at})`);
        console.log(`   - Eliminando: ${block.id} (creado: ${block.created_at})`);
      } else {
        // Este es el primer bloque con esta key, mantenerlo
        seenKeys.set(key, block.id);
        console.log(`✅ Primer bloque para key ${key}: ${block.id} (mantener)`);
      }
    });

    console.log(`🧹 Encontrados ${duplicateIds.length} bloques duplicados de ${blocks.length} totales`);

    if (duplicateIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron duplicados',
        duplicatesRemoved: 0,
        totalBlocks: blocks.length,
        uniqueBlocks: seenKeys.size
      });
    }

    // Eliminar duplicados en lotes de 100
    let totalDeleted = 0;
    for (let i = 0; i < duplicateIds.length; i += 100) {
      const batch = duplicateIds.slice(i, i + 100);
      const { error: deleteError } = await supabase
        .from('availability_blocks')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error('❌ Error al eliminar lote:', deleteError);
      } else {
        totalDeleted += batch.length;
        console.log(`✅ Eliminados ${batch.length} duplicados (${totalDeleted}/${duplicateIds.length})`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Limpieza completada: ${totalDeleted} duplicados eliminados`,
      duplicatesRemoved: totalDeleted,
      totalBlocks: blocks.length,
      uniqueBlocks: seenKeys.size,
      remainingBlocks: blocks.length - totalDeleted
    });

  } catch (error) {
    console.error('❌ Error en limpieza de duplicados:', error);
    return NextResponse.json(
      {
        error: 'Error al limpiar duplicados',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
