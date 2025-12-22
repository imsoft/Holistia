import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const following_id = searchParams.get('following_id');

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        is_following: false,
      });
    }

    if (!following_id) {
      return NextResponse.json(
        { error: 'Falta el ID del usuario' },
        { status: 400 }
      );
    }

    // Verificar si el usuario actual sigue al usuario especificado
    const { data: follow, error: followError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .maybeSingle();

    if (followError) {
      console.error('Error checking follow:', followError);
      return NextResponse.json({
        is_following: false,
      });
    }

    return NextResponse.json({
      is_following: !!follow,
    });

  } catch (error) {
    console.error('Error in check follow endpoint:', error);
    return NextResponse.json({
      is_following: false,
    });
  }
}
