import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { formatNextScheduledDate, isScheduledToday } from '@/lib/challenge-schedule';

// GET - Obtener progreso de un reto
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const challenge_purchase_id = searchParams.get('challenge_purchase_id');

    if (!challenge_purchase_id) {
      return NextResponse.json(
        { error: 'Falta el ID de la compra del reto' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener progreso junto con schedule_days de la compra
    const { data: progress, error: progressError } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_purchase_id', challenge_purchase_id)
      .maybeSingle();

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      return NextResponse.json(
        { error: 'Error al obtener progreso' },
        { status: 500 }
      );
    }

    // Obtener schedule_days de la compra
    const { data: purchase } = await supabase
      .from('challenge_purchases')
      .select('participant_id, schedule_days')
      .eq('id', challenge_purchase_id)
      .single();

    // Si no existe progreso, crear uno inicial
    if (!progress) {
      if (!purchase || purchase.participant_id !== user.id) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 403 }
        );
      }

      const { data: newProgress, error: createError } = await supabase
        .from('challenge_progress')
        .insert({
          challenge_purchase_id,
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          days_completed: 0,
          completion_percentage: 0,
          level: 1,
          status: 'in_progress',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating progress:', createError);
        return NextResponse.json(
          { error: 'Error al crear progreso' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        progress: newProgress,
        schedule_days: purchase?.schedule_days ?? null,
        next_scheduled_date: formatNextScheduledDate(purchase?.schedule_days),
        scheduled_today: isScheduledToday(purchase?.schedule_days),
      });
    }

    return NextResponse.json({
      progress,
      schedule_days: purchase?.schedule_days ?? null,
      next_scheduled_date: formatNextScheduledDate(purchase?.schedule_days),
      scheduled_today: isScheduledToday(purchase?.schedule_days),
    });

  } catch (error) {
    console.error('Error in GET /api/challenges/progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
