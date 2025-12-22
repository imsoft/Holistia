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
        { error: 'Falta el ID del usuario a seguir' },
        { status: 400 }
      );
    }

    // Validar que no se siga a sí mismo
    if (user.id === following_id) {
      return NextResponse.json(
        { error: 'No puedes seguirte a ti mismo' },
        { status: 400 }
      );
    }

    // Verificar si ya está siguiendo
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .maybeSingle();

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Ya estás siguiendo a este usuario' },
        { status: 400 }
      );
    }

    // Crear el seguimiento
    const { data: follow, error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: following_id,
      })
      .select()
      .single();

    if (followError) {
      console.error('Error creating follow:', followError);
      return NextResponse.json(
        { error: 'Error al seguir al usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      follow: follow,
    });

  } catch (error) {
    console.error('Error in follow endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
