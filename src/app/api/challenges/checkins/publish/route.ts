import { createClientForRequest } from '@/utils/supabase/api-auth';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClientForRequest(request);
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
        is_public,
        challenge_purchases!inner(
          participant_id,
          challenge_id,
          challenges!inner(
            id,
            created_by_type,
            is_active,
            is_public
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

    // Verificar que el reto está activo solo cuando se intenta publicar
    if (is_public) {
      // Solo verificar que el reto está activo
      if (!challenge.is_active) {
        return NextResponse.json(
          { error: 'No puedes publicar check-ins de retos inactivos' },
          { status: 400 }
        );
      }
    }

    // Si se está ocultando (is_public = false), no necesitamos validar el tipo de reto
    // Actualizar el estado is_public del check-in
    const { error: updateError } = await supabase
      .from('challenge_checkins')
      .update({ is_public: is_public })
      .eq('id', checkin_id);

    if (updateError) {
      console.error('Error updating checkin:', updateError);
      console.error('Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return NextResponse.json(
        { error: `Error al actualizar el check-in: ${updateError.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }

    // Obtener el check-in actualizado por separado para evitar problemas con relaciones
    const { data: updatedCheckin, error: fetchError } = await supabase
      .from('challenge_checkins')
      .select('id, challenge_purchase_id, day_number, checkin_date, checkin_time, evidence_type, evidence_url, notes, points_earned, is_public, allow_comments, likes_count, comments_count, verified_by_professional, verified_at, created_at')
      .eq('id', checkin_id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated checkin:', fetchError);
      // Aún así retornar éxito si el update funcionó
      return NextResponse.json({
        success: true,
        checkin: { id: checkin_id, is_public: is_public },
      });
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
