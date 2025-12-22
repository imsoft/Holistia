import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

    // Parse request body
    const body = await request.json();
    const { following_id } = body;

    // Validar campos requeridos
    if (!following_id) {
      return NextResponse.json(
        { error: 'Falta el ID del usuario a dejar de seguir' },
        { status: 400 }
      );
    }

    // Eliminar el seguimiento
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', following_id);

    if (unfollowError) {
      console.error('Error deleting follow:', unfollowError);
      return NextResponse.json(
        { error: 'Error al dejar de seguir al usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('Error in unfollow endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
