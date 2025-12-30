import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// DEPRECATED: Challenges are now free. This endpoint is kept for backward compatibility.
// Users should use the join challenge functionality instead.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { challenge_id } = body;

    if (!challenge_id) {
      return NextResponse.json(
        { error: 'Falta el ID del reto' },
        { status: 400 }
      );
    }

    // Verificar que el reto existe
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title')
      .eq('id', challenge_id)
      .eq('is_active', true)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado o no disponible' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya está participando
    const { data: existingParticipation } = await supabase
      .from('challenge_purchases')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('participant_id', user.id)
      .maybeSingle();

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Ya estás participando en este reto' },
        { status: 400 }
      );
    }

    // Crear participación (gratis)
    const { error: participationError } = await supabase
      .from('challenge_purchases')
      .insert({
        challenge_id: challenge_id,
        participant_id: user.id,
        access_granted: true,
      });

    if (participationError) {
      console.error('Error creating challenge participation:', participationError);
      return NextResponse.json(
        { error: 'Error al unirse al reto' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Te has unido al reto exitosamente',
    });

  } catch (error) {
    console.error('❌ Error in challenge checkout (deprecated):', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
