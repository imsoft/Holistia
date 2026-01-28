import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
      day_number,
      evidence_type = 'none',
      evidence_url,
      notes,
      is_public = false, // Por defecto privado
    } = body;

    // Validar campos requeridos
    if (!challenge_purchase_id || !day_number) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el dueño de la compra y tiene acceso
    // Separar query para evitar problemas con RLS en joins
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .select('participant_id, access_granted, challenge_id')
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

    if (!purchase.access_granted) {
      return NextResponse.json(
        { error: 'No tienes acceso a este reto' },
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
    if (durationDays && day_number > durationDays) {
      return NextResponse.json(
        { error: 'El día excede la duración del reto' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un check-in para este día
    const { data: existingCheckin } = await supabase
      .from('challenge_checkins')
      .select('id')
      .eq('challenge_purchase_id', challenge_purchase_id)
      .eq('day_number', day_number)
      .maybeSingle();

    if (existingCheckin) {
      return NextResponse.json(
        { error: 'Ya has hecho check-in para este día' },
        { status: 400 }
      );
    }

    // Crear el check-in (el trigger calculará los puntos automáticamente)
    const { data: checkin, error: checkinError } = await supabase
      .from('challenge_checkins')
      .insert({
        challenge_purchase_id,
        day_number: parseInt(day_number),
        evidence_type: evidence_type || 'none',
        evidence_url: evidence_url || null,
        notes: notes || null,
        is_public: is_public === true, // Solo público si explícitamente se solicita
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

    return NextResponse.json({
      checkin,
      unlocked_badges: unlockedBadges || [],
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/challenges/checkins:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
