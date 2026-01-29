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

    // Obtener progreso
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

    // Si no existe progreso, crear uno inicial
    if (!progress) {
      // Verificar que el usuario es el dueño
      const { data: purchase } = await supabase
        .from('challenge_purchases')
        .select('participant_id')
        .eq('id', challenge_purchase_id)
        .single();

      if (!purchase || purchase.participant_id !== user.id) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 403 }
        );
      }

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
        return NextResponse.json(
          { error: 'Error al crear progreso' },
          { status: 500 }
        );
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
