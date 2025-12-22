import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// DELETE - Eliminar un archivo de un reto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId, fileId } = await params;

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el archivo existe y pertenece a un reto del usuario
    const { data: file, error: fileError } = await supabase
      .from('challenge_files')
      .select(`
        *,
        challenges!inner(
          professional_applications!inner(user_id)
        )
      `)
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    if (file.challenges.professional_applications.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Eliminar el archivo de Supabase Storage si existe
    if (file.file_url) {
      try {
        // Extraer el path del archivo de la URL
        const urlParts = file.file_url.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('/');
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          
          const { error: storageError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continuar con la eliminación del registro aunque falle el storage
          }
        }
      } catch (storageErr) {
        console.error('Error processing storage deletion:', storageErr);
      }
    }

    // Eliminar el registro del archivo
    const { error: deleteError } = await supabase
      .from('challenge_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('Error deleting challenge file:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/challenges/[id]/files/[fileId]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
