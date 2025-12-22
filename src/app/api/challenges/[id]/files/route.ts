import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Obtener archivos de un reto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;

    const { data: files, error } = await supabase
      .from('challenge_files')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching challenge files:', error);
      return NextResponse.json(
        { error: 'Error al obtener archivos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ files: files || [] });

  } catch (error) {
    console.error('Error in GET /api/challenges/[id]/files:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Agregar un archivo a un reto
export async function POST(
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
    const { data: challenge, error: checkError } = await supabase
      .from('challenges')
      .select(`
        *,
        professional_applications!inner(user_id)
      `)
      .eq('id', challengeId)
      .single();

    if (checkError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    if (challenge.professional_applications.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      file_name,
      file_url,
      file_type,
      file_size_mb,
      display_order = 0,
      description,
    } = body;

    // Validar campos requeridos
    if (!file_name || !file_url || !file_type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear el archivo
    const { data: file, error: fileError } = await supabase
      .from('challenge_files')
      .insert({
        challenge_id: challengeId,
        file_name,
        file_url,
        file_type,
        file_size_mb: file_size_mb ? parseFloat(file_size_mb) : null,
        display_order: parseInt(display_order) || 0,
        description: description || null,
      })
      .select()
      .single();

    if (fileError) {
      console.error('Error creating challenge file:', fileError);
      return NextResponse.json(
        { error: 'Error al crear el archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ file }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/challenges/[id]/files:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
