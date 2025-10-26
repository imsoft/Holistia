import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, status } = await request.json();

    // Validar que el status sea válido
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Validar que el userId esté presente
    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, account_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el estado del usuario
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ account_status: status })
      .eq('id', userId);

    if (updateError) {
      console.error('Error actualizando estado del usuario:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el estado del usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Usuario ${status === 'suspended' ? 'suspendido' : status === 'active' ? 'reactivado' : 'actualizado'} correctamente`,
      userId,
      newStatus: status
    });

  } catch (error) {
    console.error('Error en update-user-status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
