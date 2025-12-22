import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Obtener badges desbloqueados de un reto
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

    // Obtener badges desbloqueados
    const { data: userBadges, error: badgesError } = await supabase
      .from('challenge_user_badges')
      .select(`
        *,
        challenge_badges (
          id,
          badge_name,
          badge_description,
          badge_icon,
          badge_color,
          badge_type
        )
      `)
      .eq('challenge_purchase_id', challenge_purchase_id)
      .order('unlocked_at', { ascending: false });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return NextResponse.json(
        { error: 'Error al obtener badges' },
        { status: 500 }
      );
    }

    // Obtener todos los badges disponibles (para mostrar cuáles faltan)
    const { data: purchase } = await supabase
      .from('challenge_purchases')
      .select('challenge_id')
      .eq('id', challenge_purchase_id)
      .single();

    if (purchase) {
      const { data: allBadges } = await supabase
        .from('challenge_badges')
        .select('*')
        .or(`challenge_id.eq.${purchase.challenge_id},challenge_id.is.null`)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const unlockedBadgeIds = (userBadges || []).map(ub => ub.badge_id);
      const lockedBadges = (allBadges || []).filter(b => !unlockedBadgeIds.includes(b.id));

      return NextResponse.json({
        unlocked: userBadges || [],
        locked: lockedBadges || [],
      });
    }

    return NextResponse.json({
      unlocked: userBadges || [],
      locked: [],
    });

  } catch (error) {
    console.error('Error in GET /api/challenges/badges:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
