import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'Falta el ID del usuario' },
        { status: 400 }
      );
    }

    // Obtener estadísticas de seguimiento
    const { data: stats, error: statsError } = await supabase
      .from('user_follow_stats')
      .select('followers_count, following_count')
      .eq('user_id', user_id)
      .maybeSingle();

    if (statsError) {
      console.error('Error fetching follow stats:', statsError);
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      followers_count: stats?.followers_count || 0,
      following_count: stats?.following_count || 0,
    });

  } catch (error) {
    console.error('Error in follow stats endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
