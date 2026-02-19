import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { calculateScheduleAwareStreak } from '@/lib/challenge-schedule';

// GET - Buscar purchase existente para un reto y usuario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'Falta el user_id' },
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

    // Verificar que el usuario solicitado es el autenticado
    if (user.id !== user_id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Buscar purchase existente
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('participant_id', user_id)
      .maybeSingle();

    if (purchaseError) {
      console.error('Error fetching purchase:', purchaseError);
      return NextResponse.json(
        { error: 'Error al buscar purchase' },
        { status: 500 }
      );
    }

    return NextResponse.json({ purchase: purchase || null });
  } catch (error) {
    console.error('Error in GET /api/challenges/[id]/purchase:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear purchase automáticamente para el creador del reto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el reto existe y que el usuario es el creador
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, created_by_user_id, price')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el creador del reto
    if (challenge.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo el creador del reto puede auto-unirse' },
        { status: 403 }
      );
    }

    // Verificar si ya existe un purchase
    const { data: existingPurchase } = await supabase
      .from('challenge_purchases')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('participant_id', user.id)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json({ purchase: existingPurchase });
    }

    // Crear purchase automáticamente (gratis para el creador)
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .insert({
        challenge_id: challengeId,
        participant_id: user.id,
        access_granted: true, // El creador siempre tiene acceso
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error('Error creating purchase:', purchaseError);
      return NextResponse.json(
        { error: 'Error al crear purchase' },
        { status: 500 }
      );
    }

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error('Error in POST /api/challenges/[id]/purchase:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar schedule_days de la participación del usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { schedule_days } = body;

    if (!Array.isArray(schedule_days)) {
      return NextResponse.json({ error: 'schedule_days debe ser un array' }, { status: 400 });
    }

    // Verificar que el usuario es participante del reto
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .select('id, participant_id, started_at, created_at')
      .eq('challenge_id', challengeId)
      .eq('participant_id', user.id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Participación no encontrada' }, { status: 404 });
    }

    const newScheduleDays = schedule_days.length > 0 ? schedule_days : null;

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('challenge_purchases')
      .update({ schedule_days: newScheduleDays })
      .eq('id', purchase.id)
      .select()
      .single();

    if (updateError || !updatedPurchase) {
      console.error('Error updating schedule_days:', updateError);
      return NextResponse.json({ error: 'Error al actualizar días programados' }, { status: 500 });
    }

    // Recalcular racha con el nuevo horario
    if (newScheduleDays && newScheduleDays.length > 0) {
      const startRef = purchase.started_at || purchase.created_at;
      const { data: checkins } = await supabase
        .from('challenge_checkins')
        .select('checkin_date')
        .eq('challenge_purchase_id', purchase.id);

      if (checkins && checkins.length > 0 && startRef) {
        const newStreak = calculateScheduleAwareStreak(newScheduleDays, startRef, checkins) ?? 0;
        const { data: progressRow } = await supabase
          .from('challenge_progress')
          .select('longest_streak')
          .eq('challenge_purchase_id', purchase.id)
          .maybeSingle();

        const newLongest = Math.max(newStreak, progressRow?.longest_streak ?? 0);
        await supabase
          .from('challenge_progress')
          .update({ current_streak: newStreak, longest_streak: newLongest })
          .eq('challenge_purchase_id', purchase.id);
      }
    }

    return NextResponse.json({ purchase: updatedPurchase });
  } catch (error) {
    console.error('Error in PATCH /api/challenges/[id]/purchase:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
