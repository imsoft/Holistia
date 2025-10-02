-- Configuración de Supabase Storage para galería de profesionales
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Crear el bucket para la galería de profesionales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'professional-gallery',
  'professional-gallery',
  true,
  2097152, -- 2MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. Crear políticas RLS para el bucket

-- Política para que los profesionales puedan subir sus propias imágenes
CREATE POLICY "Professionals can upload their own gallery images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'professional-gallery' AND
  auth.uid()::text = (storage.foldername(name))[2] -- professional/{user_id}/gallery/
);

-- Política para que los profesionales puedan ver sus propias imágenes
CREATE POLICY "Professionals can view their own gallery images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'professional-gallery' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Política para que los profesionales puedan eliminar sus propias imágenes
CREATE POLICY "Professionals can delete their own gallery images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'professional-gallery' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Política para que todos puedan ver las imágenes públicas (para mostrar en perfiles)
CREATE POLICY "Anyone can view public gallery images" ON storage.objects
FOR SELECT USING (bucket_id = 'professional-gallery');

-- 3. Función para limpiar imágenes huérfanas cuando se elimina un profesional
CREATE OR REPLACE FUNCTION cleanup_professional_gallery()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar todas las imágenes del profesional cuando se elimina su aplicación
  DELETE FROM storage.objects 
  WHERE bucket_id = 'professional-gallery' 
  AND name LIKE 'professional/' || OLD.user_id || '/gallery/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para limpiar imágenes cuando se elimina una aplicación profesional
CREATE TRIGGER cleanup_professional_gallery_trigger
  AFTER DELETE ON professional_applications
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_professional_gallery();

-- 5. Función para validar el tamaño y tipo de archivo
CREATE OR REPLACE FUNCTION validate_gallery_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que el archivo esté en la carpeta correcta
  IF NOT (NEW.name ~ '^professional/[a-f0-9-]{36}/gallery/') THEN
    RAISE EXCEPTION 'Invalid file path for gallery image';
  END IF;
  
  -- Verificar el tamaño del archivo (2MB máximo)
  IF NEW.metadata->>'size' IS NOT NULL AND 
     (NEW.metadata->>'size')::bigint > 2097152 THEN
    RAISE EXCEPTION 'File size exceeds 2MB limit';
  END IF;
  
  -- Verificar el tipo MIME
  IF NEW.metadata->>'mimetype' NOT IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp') THEN
    RAISE EXCEPTION 'Invalid file type. Only images are allowed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para validar imágenes antes de subirlas
CREATE TRIGGER validate_gallery_image_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'professional-gallery')
  EXECUTE FUNCTION validate_gallery_image();

-- 7. Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_storage_objects_professional_gallery 
ON storage.objects (bucket_id, name) 
WHERE bucket_id = 'professional-gallery';

