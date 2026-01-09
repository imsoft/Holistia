import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
