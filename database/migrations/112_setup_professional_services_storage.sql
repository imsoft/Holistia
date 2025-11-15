-- ============================================================================
-- MIGRACIÓN: Configurar storage bucket para imágenes de servicios profesionales
-- ============================================================================
-- Este bucket almacenará las imágenes de los servicios que ofrecen los profesionales
-- ============================================================================

-- 1. Crear el bucket professional-services si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-services', 'professional-services', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS en el bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Política de lectura pública (cualquiera puede ver las imágenes de servicios)
CREATE POLICY IF NOT EXISTS "Public can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'professional-services');

-- 4. Política de subida (solo el profesional dueño del servicio puede subir)
CREATE POLICY IF NOT EXISTS "Professionals can upload their service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'professional-services' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política de actualización (solo el profesional dueño puede actualizar)
CREATE POLICY IF NOT EXISTS "Professionals can update their service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'professional-services' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'professional-services' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Política de eliminación (solo el profesional dueño puede eliminar)
CREATE POLICY IF NOT EXISTS "Professionals can delete their service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'professional-services' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Comentarios
COMMENT ON TABLE storage.buckets IS 'Buckets de almacenamiento de archivos';

-- Verificación
SELECT 
  '✅ Bucket professional-services creado y configurado' as status,
  id,
  name,
  public
FROM storage.buckets
WHERE id = 'professional-services';

-- Ver políticas creadas
SELECT 
  '✅ Políticas RLS creadas para professional-services' as status,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%service%';

