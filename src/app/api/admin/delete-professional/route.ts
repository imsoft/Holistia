import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export async function DELETE(request: NextRequest) {
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profile?.type !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Obtener professionalId del body
    const { professionalId } = await request.json();

    if (!professionalId) {
      return NextResponse.json(
        { error: 'Se requiere professionalId' },
        { status: 400 }
      );
    }

    // Obtener el user_id del profesional
    const { data: professional, error: fetchError } = await supabase
      .from('professional_applications')
      .select('id, user_id, first_name, last_name')
      .eq('id', professionalId)
      .single();

    if (fetchError || !professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Evitar que un admin se elimine a sí mismo
    if (professional.user_id === user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();

    // 1. Eliminar digital_product_purchases (tiene ON DELETE RESTRICT, bloquea cascade)
    const { error: purchasesError } = await supabaseAdmin
      .from('digital_product_purchases')
      .delete()
      .eq('professional_id', professionalId);

    if (purchasesError) {
      console.error('Error eliminando digital_product_purchases:', purchasesError);
      return NextResponse.json(
        { error: 'Error al eliminar compras de productos digitales del profesional' },
        { status: 500 }
      );
    }

    // 2. Eliminar usuario de auth.users (cascadea a profiles, professional_applications, y todo lo relacionado)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      professional.user_id
    );

    if (deleteError) {
      console.error('Error eliminando usuario:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la cuenta del usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Profesional ${professional.first_name} ${professional.last_name} eliminado exitosamente`,
    });

  } catch (error) {
    console.error('Error en delete-professional:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
