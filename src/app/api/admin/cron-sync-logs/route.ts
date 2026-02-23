import { NextRequest, NextResponse } from 'next/server';
import { createClientForRequest } from '@/utils/supabase/api-auth';
import { createServiceRoleClient } from '@/utils/supabase/server';

/**
 * GET /api/admin/cron-sync-logs
 *
 * Endpoint para obtener el historial de ejecuciones del cron de sincronización
 * de Google Calendar. Solo accesible para usuarios administradores.
 * Soporta Bearer (app) y cookies (web).
 *
 * Query params:
 * - limit: número de registros a devolver (default: 20)
 * - offset: offset para paginación (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRequest(request);

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea administrador
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profileError || adminProfile?.type !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a este recurso' },
        { status: 403 }
      );
    }

    // Obtener parámetros de paginación
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validar parámetros
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'El límite debe estar entre 1 y 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'El offset debe ser mayor o igual a 0' },
        { status: 400 }
      );
    }

    // Usar service role para leer logs (evita problemas de RLS; ya verificamos que es admin)
    const supabaseAdmin = createServiceRoleClient();

    // Obtener logs con paginación
    const { data: logs, error: logsError, count } = await supabaseAdmin
      .from('cron_sync_logs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('Error al obtener logs de cron sync:', logsError);
      return NextResponse.json(
        {
          error: 'Error al obtener logs de sincronización',
          details: logsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error en /api/admin/cron-sync-logs:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
