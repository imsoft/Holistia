import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { checkin_id, is_public } = body;

    if (!checkin_id || typeof is_public !== 'boolean') {
      return NextResponse.json(
        { error: 'checkin_id y is_public son requeridos' },
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

    // Obtener el check-in y verificar que pertenece al usuario
    const { data: checkin, error: checkinError } = await supabase
      .from('challenge_checkins')
      .select(`
        id,
        challenge_purchase_id,
        challenge_purchases!inner(
          participant_id,
          challenge_id,
          challenges!inner(
            id,
            created_by_type,
            is_active
          )
        )
      `)
      .eq('id', checkin_id)
      .single();

    if (checkinError || !checkin) {
      return NextResponse.json(
        { error: 'Check-in no encontrado' },
        { status: 404 }
      );
    }

    const purchase = Array.isArray(checkin.challenge_purchases)
      ? checkin.challenge_purchases[0]
      : checkin.challenge_purchases;

    // Verificar que el usuario es el dueño del check-in
    if (purchase.participant_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const challenge = Array.isArray(purchase.challenges)
      ? purchase.challenges[0]
      : purchase.challenges;

    // Verificar que el reto es público (creado por profesional y activo)
    if (is_public && (challenge.created_by_type !== 'professional' || !challenge.is_active)) {
      return NextResponse.json(
        { error: 'Solo puedes publicar check-ins de retos públicos creados por profesionales' },
        { status: 400 }
      );
    }

    // Actualizar el estado is_public del check-in
    const { data: updatedCheckin, error: updateError } = await supabase
      .from('challenge_checkins')
      .update({ is_public })
      .eq('id', checkin_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating checkin:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkin: updatedCheckin,
    });

  } catch (error) {
    console.error('Error in PATCH /api/challenges/checkins/publish:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
