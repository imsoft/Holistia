import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Obtener un reto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;

    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        professional_applications!inner(
          id,
          first_name,
          last_name,
          profile_photo,
          profession,
          is_verified
        )
      `)
      .eq('id', challengeId)
      .eq('is_active', true)
      .single();

    if (error || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ challenge });

  } catch (error) {
    console.error('Error in GET /api/challenges/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un reto
export async function PUT(
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

    // Verificar que el reto existe y pertenece al usuario
    const { data: existingChallenge, error: checkError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (checkError || !existingChallenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el creador del reto
    if (existingChallenge.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado: solo el creador puede actualizar el reto' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
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
      is_active,
    } = body;

    // Si se vincula a un profesional, verificar que existe
    if (linked_professional_id !== undefined && linked_professional_id) {
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

    // Actualizar el reto
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url;
    if (duration_days !== undefined) updateData.duration_days = duration_days ? parseInt(duration_days) : null;
    if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
    if (category !== undefined) updateData.category = category;
    if (wellness_areas !== undefined) updateData.wellness_areas = wellness_areas || [];
    if (linked_patient_id !== undefined) updateData.linked_patient_id = linked_patient_id || null;
    if (linked_professional_id !== undefined) updateData.linked_professional_id = linked_professional_id || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: challenge, error: updateError } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', challengeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating challenge:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el reto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge });

  } catch (error) {
    console.error('Error in PUT /api/challenges/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un reto
export async function DELETE(
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

    // Verificar que el reto existe y pertenece al usuario
    const { data: existingChallenge, error: checkError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (checkError || !existingChallenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el creador del reto
    if (existingChallenge.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado: solo el creador puede eliminar el reto' },
        { status: 403 }
      );
    }

    // Eliminar el reto (CASCADE eliminará los archivos y participaciones asociadas)
    const { error: deleteError } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (deleteError) {
      console.error('Error deleting challenge:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el reto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/challenges/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
