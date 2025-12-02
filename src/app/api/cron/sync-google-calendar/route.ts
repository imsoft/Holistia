import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
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
      return NextResponse.json({
        success: true,
        message: 'No profiles with Google Calendar connected',
        syncedCount: 0,
        totalProfiles: 0
      });
    }

    console.log(`🔄 Starting sync for ${profiles.length} profiles with Google Calendar connected`);

    // Sincronizar cada perfil
    const results = await Promise.allSettled(
      profiles.map(async (profile) => {
        try {
          console.log(`🔄 Syncing Google Calendar for user ${profile.id} (${profile.email})`);
          const result = await syncGoogleCalendarEvents(profile.id);

          if (result.success) {
            console.log(`✅ Synced successfully for ${profile.email}:`, result.message);
            return { userId: profile.id, email: profile.email, success: true };
          } else {
            console.log(`⚠️ Sync failed for ${profile.email}:`, result.error);
            return { userId: profile.id, email: profile.email, success: false, error: result.error };
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

    return NextResponse.json({
      success: true,
      message: `Synced ${successful} of ${profiles.length} profiles`,
      syncedCount: successful,
      failedCount: failed,
      totalProfiles: profiles.length,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' })
    });

  } catch (error) {
    console.error('Error in Google Calendar sync cron:', error);
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
    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    
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
    
    // Si no se especifica userId, usar la lógica del GET (sincronizar todos)
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
