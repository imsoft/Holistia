import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Obtener retos de un profesional
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const professional_id = searchParams.get('professional_id');

    if (!professional_id) {
      return NextResponse.json(
        { error: 'Falta el ID del profesional' },
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

    // Verificar que el profesional existe y pertenece al usuario
    const { data: professional, error: profError } = await supabase
      .from('professional_applications')
      .select('id, user_id')
      .eq('id', professional_id)
      .eq('user_id', user.id)
      .single();

    if (profError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado o no autorizado' },
        { status: 403 }
      );
    }

    // Obtener retos del profesional
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .eq('professional_id', professional_id)
      .order('created_at', { ascending: false });

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return NextResponse.json(
        { error: 'Error al obtener retos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenges: challenges || [] });

  } catch (error) {
    console.error('Error in GET /api/challenges:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo reto
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
      professional_id,
      title,
      description,
      short_description,
      price,
      currency = 'MXN',
      cover_image_url,
      duration_days,
      difficulty_level,
      category,
    } = body;

    // Validar campos requeridos
    if (!professional_id || !title || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el profesional existe y pertenece al usuario
    const { data: professional, error: profError } = await supabase
      .from('professional_applications')
      .select('id, user_id, status, is_active')
      .eq('id', professional_id)
      .eq('user_id', user.id)
      .single();

    if (profError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado o no autorizado' },
        { status: 403 }
      );
    }

    if (professional.status !== 'approved' || !professional.is_active) {
      return NextResponse.json(
        { error: 'El profesional no está aprobado o activo' },
        { status: 403 }
      );
    }

    // Crear el reto
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        professional_id,
        title,
        description,
        short_description: short_description || null,
        price: parseFloat(price),
        currency,
        cover_image_url: cover_image_url || null,
        duration_days: duration_days ? parseInt(duration_days) : null,
        difficulty_level: difficulty_level || null,
        category: category || null,
        is_active: true,
      })
      .select()
      .single();

    if (challengeError) {
      console.error('Error creating challenge:', challengeError);
      return NextResponse.json(
        { error: 'Error al crear el reto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/challenges:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
