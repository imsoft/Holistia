import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { syncGoogleCalendarEvents } from '@/actions/google-calendar/sync';

/**
 * Cron job para sincronizar eventos de Google Calendar periódicamente
 *
 * Este endpoint debe ser llamado por un servicio de cron (ej: Vercel Cron, Upstash QStash)
 * Se recomienda ejecutar cada 15-30 minutos
 *
 * Configuración en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-google-calendar",
 *     "schedule": "0,15,30,45 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que sea una solicitud de cron autorizada
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();
    const startTime = Date.now();

    // Crear entrada de log inicial
    let logId: string | null = null;
    try {
      const { data: logEntry } = await supabaseAdmin
        .from('cron_sync_logs')
        .insert({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      logId = logEntry?.id || null;
    } catch (logError) {
      console.error('Error al crear log inicial:', logError);
      // Continuar sin log - no bloquear el cron
    }

    // Obtener todos los profesionales que tienen Google Calendar conectado
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('google_calendar_connected', true)
      .not('google_access_token', 'is', null)
      .not('google_refresh_token', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Error fetching profiles' },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      // Actualizar log si no hay perfiles
      if (logId) {
        try {
          await supabaseAdmin
            .from('cron_sync_logs')
            .update({
              status: 'completed',
              finished_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
              total_profiles: 0,
            })
            .eq('id', logId);
        } catch (updateError) {
          console.error('Error al actualizar log (no profiles):', updateError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'No profiles with Google Calendar connected',
        syncedCount: 0,
        totalProfiles: 0
      });
    }

    console.log(`🔄 Starting sync for ${profiles.length} profiles with Google Calendar connected`);

    // Actualizar total de perfiles en el log
    if (logId) {
      try {
        await supabaseAdmin
          .from('cron_sync_logs')
          .update({ total_profiles: profiles.length })
          .eq('id', logId);
      } catch (updateError) {
        console.error('Error al actualizar total_profiles:', updateError);
      }
    }

    // Sincronizar cada perfil
    const results = await Promise.allSettled(
      profiles.map(async (profile) => {
        try {
          console.log(`🔄 Syncing Google Calendar for user ${profile.id} (${profile.email})`);
          const result = await syncGoogleCalendarEvents(profile.id);

          if (result.success) {
            console.log(`✅ Synced successfully for ${profile.email}:`, result.message);
            return {
              userId: profile.id,
              email: profile.email,
              success: true,
              created: result.created || 0,
              deleted: result.deleted || 0,
              diagnostics: result.diagnostics || null,
            };
          } else {
            console.log(`⚠️ Sync failed for ${profile.email}:`, result.error);
            return {
              userId: profile.id,
              email: profile.email,
              success: false,
              error: result.error
            };
          }
        } catch (error) {
          console.error(`❌ Error syncing ${profile.email}:`, error);
          return {
            userId: profile.id,
            email: profile.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length;

    console.log(`✅ Sync completed: ${successful} successful, ${failed} failed out of ${profiles.length} profiles`);

    // Actualizar log con resultados finales
    const endTime = Date.now();
    const detailedResults = results.map(r =>
      r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' }
    );

    if (logId) {
      try {
        await supabaseAdmin
          .from('cron_sync_logs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            duration_ms: endTime - startTime,
            successful_count: successful,
            failed_count: failed,
            results: detailedResults,
          })
          .eq('id', logId);
      } catch (updateError) {
        console.error('Error al actualizar log final:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successful} of ${profiles.length} profiles`,
      syncedCount: successful,
      failedCount: failed,
      totalProfiles: profiles.length,
      results: detailedResults
    });

  } catch (error) {
    console.error('Error in Google Calendar sync cron:', error);

    // Actualizar log con error si existe
    try {
      const supabaseAdmin = createServiceRoleClient();
      // Intentar obtener logId del scope superior (puede no estar disponible)
      // Si el error ocurrió antes de crear el log, esto no hará nada
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Buscar el log más reciente con status 'running' para marcarlo como error
      const { data: runningLogs } = await supabaseAdmin
        .from('cron_sync_logs')
        .select('id')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1);

      if (runningLogs && runningLogs.length > 0) {
        await supabaseAdmin
          .from('cron_sync_logs')
          .update({
            status: 'error',
            finished_at: new Date().toISOString(),
            error_message: errorMessage,
          })
          .eq('id', runningLogs[0].id);
      }
    } catch (logError) {
      console.error('Error al actualizar log de error:', logError);
    }

    return NextResponse.json(
      {
        error: 'Error syncing Google Calendar',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// También permitir POST para compatibilidad con diferentes servicios de cron
// Si se envía un userId en el body, sincroniza solo ese profesional
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación: o bien CRON_SECRET o bien el usuario autenticado
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    let isAuthorizedByCron = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorizedByCron = true;
    }

    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // Si no es cron, verificar que el usuario autenticado sea el mismo que pide el sync
    if (!isAuthorizedByCron) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Solo puede sincronizar su propio calendario
      if (userId && userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Si se especifica un userId, sincronizar solo ese profesional
    if (userId) {
      console.log(`🔄 Syncing Google Calendar for specific user ${userId}`);
      const result = await syncGoogleCalendarEvents(userId);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message || 'Google Calendar sincronizado correctamente',
          created: result.created || 0,
          deleted: result.deleted || 0
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Error al sincronizar Google Calendar'
          },
          { status: 400 }
        );
      }
    }
    
    // Si no se especifica userId, usar la lógica del GET (sincronizar todos) - solo cron
    if (!isAuthorizedByCron) {
      return NextResponse.json({ error: 'Se requiere userId' }, { status: 400 });
    }
    return GET(request);
  } catch (error) {
    console.error('Error in Google Calendar sync POST:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
