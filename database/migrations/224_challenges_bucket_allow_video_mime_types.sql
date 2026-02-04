-- ============================================================================
-- MIGRACIÓN 224: Permitir tipos MIME de vídeo en el bucket challenges
-- ============================================================================
-- Motivo: Los check-ins permiten subir vídeos (MP4, WEBM, MOV) pero el bucket
--         puede tener "Restrict MIME types" con solo imágenes, causando
--         "No se pudo cargar el vídeo. Comprueba la conexión o permisos del bucket."
-- ============================================================================

-- Actualizar el bucket challenges para permitir imágenes + vídeos (y 50MB)
UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
WHERE id = 'challenges';

-- Si el bucket no existía en storage.buckets (creado solo desde Dashboard),
-- esta migración no inserta; hay que añadir los MIME types manualmente en
-- Supabase Dashboard → Storage → challenges → Edit bucket →
-- "Restrict MIME types" → añadir: video/mp4, video/webm, video/quicktime
