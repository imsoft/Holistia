import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST - Subir evidencia multimedia para check-in
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const challenge_purchase_id = formData.get('challenge_purchase_id') as string;
    const evidence_type = formData.get('evidence_type') as string;

    if (!file || !challenge_purchase_id || !evidence_type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el dueño de la compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('challenge_purchases')
      .select('participant_id, access_granted')
      .eq('id', challenge_purchase_id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 }
      );
    }

    if (purchase.participant_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    if (!purchase.access_granted) {
      return NextResponse.json(
        { error: 'No tienes acceso a este reto' },
        { status: 403 }
      );
    }

    // Validar tipo de archivo según evidence_type (solo foto y video, audio no permitido)
    const validTypes: Record<string, string[]> = {
      photo: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'],
    };

    // No permitir audios
    if (evidence_type === 'audio') {
      return NextResponse.json(
        { error: 'La subida de audios no está permitida. Por favor sube una foto o video.' },
        { status: 400 }
      );
    }

    if (evidence_type !== 'text' && validTypes[evidence_type]) {
      if (!validTypes[evidence_type].includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no válido para ${evidence_type}. Formatos permitidos: ${evidence_type === 'photo' ? 'JPG, PNG, WEBP, GIF' : 'MP4, WEBM, MOV'}` },
          { status: 400 }
        );
      }
    }

    // Validar tamaño según tipo de archivo
    // Fotos: máximo 10MB, Videos: máximo 25MB
    const maxSizePhoto = 10 * 1024 * 1024; // 10MB
    const maxSizeVideo = 25 * 1024 * 1024; // 25MB
    const maxSize = evidence_type === 'video' ? maxSizeVideo : maxSizePhoto;
    const maxSizeLabel = evidence_type === 'video' ? '25MB' : '10MB';
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Máximo ${maxSizeLabel}` },
        { status: 400 }
      );
    }

    // Sanitizar nombre de archivo para evitar caracteres especiales problemáticos
    const sanitizeFileName = (fileName: string): string => {
      // Obtener la extensión
      const lastDotIndex = fileName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
      const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
      
      // Normalizar caracteres Unicode (convierte "ó" a "o", etc.)
      let sanitized = nameWithoutExt
        .normalize('NFD') // Descompone caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (acentos)
        .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remover caracteres de control y problemáticos
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/[^a-zA-Z0-9\-_]/g, '') // Solo permitir letras, números, guiones y guiones bajos
        .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
        .toLowerCase(); // Convertir a minúsculas
      
      // Si después de sanitizar queda vacío, usar un nombre por defecto
      if (!sanitized || sanitized.trim().length === 0) {
        sanitized = 'imagen';
      }
      
      return `${sanitized}${extension}`;
    };

    // Subir archivo a Supabase Storage
    const fileExt = file.name.split('.').pop();
    const sanitizedFileName = sanitizeFileName(file.name);
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = `${challenge_purchase_id}/evidence/${fileName}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('challenges')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Error uploading file:', {
        error: uploadError,
        message: uploadError.message,
        filePath,
        challenge_purchase_id,
        user_id: user.id,
        purchase_participant_id: purchase.participant_id,
      });
      
      // Proporcionar mensaje de error más específico
      let errorMessage = 'Error al subir el archivo';
      let statusCode = 500;
      
      const errorMsg = uploadError.message || String(uploadError);
      
      // Detectar errores de permisos
      if (errorMsg.includes('permission') || 
          errorMsg.includes('policy') || 
          errorMsg.includes('403') ||
          errorMsg.includes('unauthorized') ||
          errorMsg.includes('Forbidden')) {
        errorMessage = 'No tienes permisos para subir archivos a este reto. Verifica que seas participante del reto.';
        statusCode = 403;
      } else if (errorMsg.includes('400') || 
                 errorMsg.includes('invalid') ||
                 errorMsg.includes('format') ||
                 errorMsg.includes('Bad Request')) {
        errorMessage = 'El archivo no es válido o el formato no está permitido';
        statusCode = 400;
      } else if (errorMsg.includes('size') || 
                 errorMsg.includes('large') ||
                 errorMsg.includes('too big')) {
        errorMessage = 'El archivo es demasiado grande';
        statusCode = 400;
      } else {
        // Usar el mensaje del error si está disponible
        errorMessage = errorMsg;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('challenges')
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
    });

  } catch (error) {
    console.error('Error in POST /api/challenges/checkins/upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
