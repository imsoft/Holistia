import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

    // Verificar que el usuario es el dueño de la compra primero
    // Separar query para evitar problemas con RLS en joins
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .select('participant_id, challenge_id')
      .eq('id', challenge_purchase_id)
      .maybeSingle();

    if (purchaseError) {
      console.error('Error fetching purchase:', purchaseError);
      return NextResponse.json(
        { error: 'Error al buscar la compra' },
        { status: 500 }
      );
    }

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 }
      );
    }

    if (purchase.participant_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener información del challenge por separado si es necesario
    let durationDays: number | null = null;
    if (purchase.challenge_id) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('duration_days')
        .eq('id', purchase.challenge_id)
        .maybeSingle();
      durationDays = challenge?.duration_days || null;
    }

    // Obtener progreso
    const { data: progress, error: progressError } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_purchase_id', challenge_purchase_id)
      .maybeSingle();

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      // Si hay error pero el usuario tiene acceso, retornar progreso por defecto
      return NextResponse.json({
        progress: {
          challenge_purchase_id,
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          days_completed: 0,
          completion_percentage: 0,
          level: 1,
          status: 'in_progress',
          last_checkin_date: null,
        }
      });
    }

    // Si no existe progreso, crear uno inicial
    if (!progress) {
      // Crear progreso inicial
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
        // Retornar progreso por defecto si falla la creación
        return NextResponse.json({
          progress: {
            challenge_purchase_id,
            total_points: 0,
            current_streak: 0,
            longest_streak: 0,
            days_completed: 0,
            completion_percentage: 0,
            level: 1,
            status: 'in_progress',
            last_checkin_date: null,
          }
        });
      }

      return NextResponse.json({ progress: newProgress });
    }

    return NextResponse.json({ progress });

  } catch (error) {
    console.error('Error in GET /api/challenges/progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
