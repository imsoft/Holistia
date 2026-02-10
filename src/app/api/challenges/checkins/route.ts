import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendChallengeCompletedEmail } from '@/lib/email-sender';

// GET - Obtener check-ins de un reto
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

    // Verificar que el usuario es el dueño de la compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .select('participant_id')
      .eq('id', challenge_purchase_id)
      .single();

    if (purchaseError || !purchase) {
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

    // Obtener check-ins
    const { data: checkins, error: checkinsError } = await supabase
      .from('challenge_checkins')
      .select('*')
      .eq('challenge_purchase_id', challenge_purchase_id)
      .order('day_number', { ascending: true });

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError);
      return NextResponse.json(
        { error: 'Error al obtener check-ins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkins: checkins || [] });

  } catch (error) {
    console.error('Error in GET /api/challenges/checkins:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo check-in
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
    const {
      challenge_purchase_id,
      day_number: bodyDayNumber,
      checkin_date: bodyCheckinDate,
      evidence_type = 'none',
      evidence_url,
      notes,
      is_public = false,
    } = body;

    if (!challenge_purchase_id) {
      return NextResponse.json(
        { error: 'Falta el ID de la compra del reto' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el dueño de la compra y tiene acceso; traer started_at para calcular día por calendario
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .select('participant_id, access_granted, challenge_id, started_at, created_at, challenges(duration_days)')
      .eq('id', challenge_purchase_id)
      .single();

    if (purchaseError || !purchase) {
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

    if (!purchase.access_granted) {
      return NextResponse.json(
        { error: 'No tienes acceso a este reto' },
        { status: 403 }
      );
    }

    const challenge = Array.isArray(purchase.challenges) && purchase.challenges.length > 0
      ? purchase.challenges[0]
      : (purchase.challenges as any);
    const durationDays = challenge?.duration_days;

    // Calcular day_number por calendario: día 1 = fecha de inicio del reto para el usuario
    const startRef = purchase.started_at || purchase.created_at;
    const startDate = new Date(startRef);
    const checkinDate = bodyCheckinDate
      ? new Date(String(bodyCheckinDate).trim().slice(0, 10) + 'T12:00:00Z')
      : new Date();

    const toDateOnly = (d: Date) => ({ y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() });
    const startOnly = toDateOnly(startDate);
    const checkinOnly = toDateOnly(checkinDate);
    const startMs = Date.UTC(startOnly.y, startOnly.m, startOnly.day);
    const checkinMs = Date.UTC(checkinOnly.y, checkinOnly.m, checkinOnly.day);
    const diffDays = Math.floor((checkinMs - startMs) / (24 * 60 * 60 * 1000));
    const day_number = diffDays + 1;

    if (day_number < 1) {
      return NextResponse.json(
        { error: 'La fecha del check-in no puede ser anterior al inicio del reto' },
        { status: 400 }
      );
    }

    if (durationDays != null && day_number > durationDays) {
      return NextResponse.json(
        { error: 'El día excede la duración del reto' },
        { status: 400 }
      );
    }

    // Permitir múltiples check-ins por día (varias publicaciones del mismo día)
    // checkin_date en formato DATE para la BD (YYYY-MM-DD)
    const checkinDateStr = checkinOnly.y + '-' + String(checkinOnly.m + 1).padStart(2, '0') + '-' + String(checkinOnly.day).padStart(2, '0');

    // Crear el check-in (el trigger calculará los puntos automáticamente)
    const { data: checkin, error: checkinError } = await supabase
      .from('challenge_checkins')
      .insert({
        challenge_purchase_id,
        day_number,
        checkin_date: checkinDateStr,
        evidence_type: evidence_type || 'none',
        evidence_url: evidence_url || null,
        notes: notes || null,
        is_public: !!is_public,
      })
      .select()
      .single();

    if (checkinError) {
      console.error('Error creating checkin:', checkinError);
      return NextResponse.json(
        { error: 'Error al crear el check-in' },
        { status: 500 }
      );
    }

    // Verificar badges desbloqueados (la función se ejecuta automáticamente por trigger)
    // Pero podemos llamarla manualmente para obtener los badges desbloqueados
    let unlockedBadges: any[] = [];
    try {
      const { data: badges } = await supabase.rpc('check_and_unlock_badges', {
        p_challenge_purchase_id: challenge_purchase_id,
      });
      unlockedBadges = badges || [];
    } catch (error) {
      console.error('Error checking badges:', error);
      // Continuar aunque falle la verificación de badges
    }

    // Verificar si el reto acaba de completarse (trigger ya actualizó challenge_progress)
    let challengeCompleted = false;
    const { data: progress } = await supabase
      .from('challenge_progress')
      .select('status, total_points')
      .eq('challenge_purchase_id', challenge_purchase_id)
      .maybeSingle();

    if (progress?.status === 'completed') {
      challengeCompleted = true;
      // Enviar email de felicitación en segundo plano (no bloquear respuesta)
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io';
      const myChallengesUrl = `${baseUrl}/my-challenges?challenge=${challenge_purchase_id}`;
      const { data: purchaseRow } = await supabase
        .from('challenge_purchases')
        .select('participant_id, challenge_id')
        .eq('id', challenge_purchase_id)
        .single();
      if (purchaseRow?.participant_id) {
        const [{ data: profileRow }, { data: challengeRow }] = await Promise.all([
          supabase.from('profiles').select('first_name, last_name, full_name, email').eq('id', purchaseRow.participant_id).single(),
          supabase.from('challenges').select('title, duration_days').eq('id', purchaseRow.challenge_id).single(),
        ]);
        const participantName =
          profileRow?.full_name?.trim() ||
          [profileRow?.first_name, profileRow?.last_name].filter(Boolean).join(' ').trim() ||
          'Participante';
        const participantEmail = profileRow?.email;
        if (participantEmail && challengeRow?.title) {
          sendChallengeCompletedEmail({
            participant_name: participantName,
            participant_email: participantEmail,
            challenge_title: challengeRow.title,
            duration_days: challengeRow.duration_days || 0,
            total_points: progress.total_points || 0,
            my_challenges_url: myChallengesUrl,
          }).catch((err) => console.error('Error sending challenge completed email:', err));
        }
      }
    }

    return NextResponse.json({
      checkin,
      unlocked_badges: unlockedBadges || [],
      completed: challengeCompleted,
      challenge_purchase_id: challengeCompleted ? challenge_purchase_id : undefined,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/challenges/checkins:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
