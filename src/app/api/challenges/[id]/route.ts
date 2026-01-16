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
        professional_applications(
          id,
          first_name,
          last_name,
          profile_photo,
          profession,
          is_verified
        )
      `)
      .eq('id', challengeId)
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

    // Verificar que el reto existe
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

    // Verificar si es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('type, account_active')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.type === 'admin' && profile?.account_active === true;

    // Verificar que el usuario es el creador del reto o es admin
    if (!isAdmin && existingChallenge.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado: solo el creador o un administrador puede actualizar el reto' },
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
      professional_id,
      price,
      currency,
      is_active,
      is_public,
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

    // Si se asigna a un profesional (professional_id), verificar que existe
    if (professional_id !== undefined && professional_id) {
      const { data: prof, error: profError } = await supabase
        .from('professional_applications')
        .select('id, status, is_active')
        .eq('id', professional_id)
        .single();

      if (profError || !prof) {
        return NextResponse.json(
          { error: 'Profesional asignado no encontrado' },
          { status: 400 }
        );
      }
    }

    // Actualizar el reto
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url || null;
    if (duration_days !== undefined) updateData.duration_days = duration_days ? parseInt(duration_days.toString()) : null;
    if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level || null;
    if (category !== undefined) updateData.category = category || null;
    if (wellness_areas !== undefined) updateData.wellness_areas = wellness_areas || [];
    if (linked_patient_id !== undefined) updateData.linked_patient_id = linked_patient_id || null;
    if (linked_professional_id !== undefined) {
      // Si linked_professional_id es "none" o vacío, guardar null. Si tiene valor, guardarlo.
      updateData.linked_professional_id = (linked_professional_id && linked_professional_id !== 'none') ? linked_professional_id : null;
    }
    if (price !== undefined) {
      // Si price es null, undefined, 0, o string vacío, guardar null. Si tiene valor válido, parsearlo.
      const priceValue = price === null || price === undefined || price === '' || price === 0 
        ? null 
        : parseFloat(price.toString());
      updateData.price = priceValue;
    }
    // currency siempre se actualiza si se envía, incluso si price es null (para mantener consistencia)
    if (currency !== undefined) {
      updateData.currency = currency || 'MXN';
    }
    // Solo admins pueden cambiar professional_id
    if (isAdmin && professional_id !== undefined) {
      updateData.professional_id = professional_id || null;
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_public !== undefined) updateData.is_public = is_public;

    const { data: challenge, error: updateError } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', challengeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating challenge:', updateError);
      
      // Mensajes más descriptivos basados en el código de error
      let errorMessage = 'Error al actualizar el reto';
      
      if (updateError.code === '23502') {
        errorMessage = 'Falta completar algunos campos obligatorios. Por favor, asegúrate de llenar el título y la descripción del reto.';
      } else if (updateError.code === '23503') {
        errorMessage = 'El profesional o paciente que intentas vincular no existe o fue eliminado. Por favor, verifica la información e intenta nuevamente.';
      } else if (updateError.code === '23505') {
        errorMessage = 'Ya tienes otro reto con este título. Por favor, usa un título diferente.';
      } else if (updateError.code === 'PGRST301' || updateError.code === '42501') {
        errorMessage = isAdmin 
          ? 'Error de permisos al actualizar el reto. Si el problema persiste, contacta al soporte de Holistia.'
          : 'Solo puedes editar los retos que tú creaste. Si este reto no es tuyo, no puedes modificarlo.';
      } else if (updateError.message) {
        errorMessage = updateError.message;
      }
      
      return NextResponse.json(
        { error: errorMessage, details: updateError.details, code: updateError.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge });

  } catch (error) {
    console.error('Error in PUT /api/challenges/[id]:', error);
    
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

    // Verificar que el reto existe
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

    // Verificar si es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('type, account_active')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.type === 'admin' && profile?.account_active === true;

    // Verificar que el usuario es el creador del reto o es admin
    if (!isAdmin && existingChallenge.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado: solo el creador o un administrador puede eliminar el reto' },
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
      
      // Mensajes más descriptivos basados en el código de error
      let errorMessage = 'Error al eliminar el reto';
      
      if (deleteError.code === '23503') {
        errorMessage = 'No puedes eliminar este reto porque ya tiene participantes o personas que lo están siguiendo. Primero debes eliminar o finalizar todas las participaciones, y luego podrás eliminar el reto.';
      } else if (deleteError.code === 'PGRST301' || deleteError.code === '42501') {
        errorMessage = isAdmin
          ? 'Error de permisos al eliminar el reto. Si el problema persiste, contacta al soporte de Holistia.'
          : 'Solo puedes eliminar los retos que tú creaste. Si este reto no es tuyo, no puedes eliminarlo.';
      } else if (deleteError.message) {
        errorMessage = deleteError.message;
      }
      
      return NextResponse.json(
        { error: errorMessage, details: deleteError.details, code: deleteError.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/challenges/[id]:', error);
    
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
