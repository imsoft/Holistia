import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Obtener retos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const professional_id = searchParams.get('professional_id');
    const user_id = searchParams.get('user_id'); // Para obtener retos de un usuario específico

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('challenges')
      .select('*');

    // Si se especifica professional_id, obtener retos de ese profesional
    if (professional_id) {
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

      query = query.eq('professional_id', professional_id);
    } else if (user_id) {
      // Obtener retos creados por un usuario específico
      query = query.eq('created_by_user_id', user_id);
    } else {
      // Obtener todos los retos del usuario autenticado (creados o vinculados)
      query = query.or(`created_by_user_id.eq.${user.id},linked_patient_id.eq.${user.id}`);
    }

    const { data: challenges, error: challengesError } = await query
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
      created_by_user_id,
      created_by_type,
      title,
      description,
      short_description,
      cover_image_url,
      duration_days,
      difficulty_level,
      category,
      wellness_areas,
      linked_patient_id,
      linked_professional_id,
    } = body;

    // Validar campos requeridos
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: título y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // Validar created_by_type
    if (created_by_type && !['professional', 'patient'].includes(created_by_type)) {
      return NextResponse.json(
        { error: 'created_by_type debe ser "professional" o "patient"' },
        { status: 400 }
      );
    }

    // Si es profesional, verificar que existe y está aprobado
    if (professional_id) {
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
    }

    // Si se vincula a un profesional, verificar que existe
    if (linked_professional_id) {
      const { data: linkedProf, error: linkedProfError } = await supabase
        .from('professional_applications')
        .select('id, status, is_active')
        .eq('id', linked_professional_id)
        .single();

      if (linkedProfError || !linkedProf) {
        return NextResponse.json(
          { error: 'Profesional vinculado no encontrado' },
          { status: 400 }
        );
      }
    }

    // Crear el reto
    const challengeData: any = {
      professional_id: professional_id || null,
      created_by_user_id: created_by_user_id || user.id,
      created_by_type: created_by_type || (professional_id ? 'professional' : 'patient'),
      title,
      description,
      short_description: short_description || null,
      cover_image_url: cover_image_url || null,
      duration_days: duration_days ? parseInt(duration_days) : null,
      difficulty_level: difficulty_level || null,
      category: category || null,
      wellness_areas: wellness_areas || [],
      linked_patient_id: linked_patient_id || null,
      linked_professional_id: linked_professional_id || null,
      is_active: true,
    };

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert(challengeData)
      .select()
      .single();

    if (challengeError) {
      console.error('Error creating challenge:', challengeError);
      
      // Mensajes más descriptivos basados en el código de error
      let errorMessage = 'Error al crear el reto';
      
      if (challengeError.code === '23502') {
        errorMessage = 'Faltan campos requeridos. Por favor, completa todos los campos obligatorios (título y descripción).';
      } else if (challengeError.code === '23503') {
        errorMessage = 'Error de referencia: El profesional o paciente vinculado no existe. Por favor, verifica la información.';
      } else if (challengeError.code === '23505') {
        errorMessage = 'Ya existe un reto con este título. Por favor, usa un título diferente.';
      } else if (challengeError.code === 'PGRST301' || challengeError.code === '42501') {
        errorMessage = 'No tienes permisos para crear retos. Verifica que tu cuenta esté aprobada y activa.';
      } else if (challengeError.message) {
        errorMessage = challengeError.message;
      }
      
      return NextResponse.json(
        { error: errorMessage, details: challengeError.details, code: challengeError.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/challenges:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error interno del servidor. Si el problema persiste, contacta al soporte de Holistia.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        isSystemError: true
      },
      { status: 500 }
    );
  }
}
