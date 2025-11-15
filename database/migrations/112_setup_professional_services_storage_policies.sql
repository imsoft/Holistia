-- ============================================================================
-- CONFIGURAR POLÍTICAS DE STORAGE PARA PROFESSIONAL-SERVICES
-- ============================================================================
-- Ejecutar este script en Supabase SQL Editor
-- ============================================================================

-- Verificar que el bucket existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'professional-services') THEN
    RAISE EXCEPTION 'El bucket professional-services no existe. Créalo primero desde Storage → New bucket';
  END IF;
  RAISE NOTICE 'Bucket professional-services encontrado';
END $$;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can delete service images" ON storage.objects;

-- 1. Política de lectura pública (SELECT)
CREATE POLICY "Public can view service images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'professional-services');

-- 2. Política de subida (INSERT)
CREATE POLICY "Professionals can upload service images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Política de actualización (UPDATE)
CREATE POLICY "Professionals can update service images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Política de eliminación (DELETE)
CREATE POLICY "Professionals can delete service images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verificar que las políticas se crearon
SELECT 
  '✅ Políticas creadas exitosamente' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%service%';

-- Listar las políticas creadas
SELECT 
  policyname as "Política",
  cmd as "Operación",
  roles as "Roles"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%service%'
ORDER BY cmd;

