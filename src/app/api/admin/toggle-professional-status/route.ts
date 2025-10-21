import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea administrador
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user.id);

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Error al verificar usuario' },
        { status: 500 }
      );
    }

    const userType = userData.user.user_metadata?.type;
    if (userType !== 'admin' && userType !== 'Admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const { professionalId, isActive } = await request.json();

    if (!professionalId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Datos inválidos. Se requiere professionalId (string) e isActive (boolean)' },
        { status: 400 }
      );
    }

    // Actualizar el estado del profesional
    const { data, error } = await supabase
      .from('professional_applications')
      .update({ is_active: isActive })
      .eq('id', professionalId)
      .eq('status', 'approved') // Solo profesionales aprobados pueden ser activados/desactivados
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar estado del profesional:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el estado del profesional' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Profesional no encontrado o no está aprobado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Profesional ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      professional: {
        id: data.id,
        is_active: data.is_active,
        first_name: data.first_name,
        last_name: data.last_name
      }
    });

  } catch (error) {
    console.error('Error en toggle-professional-status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
