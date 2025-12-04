-- =====================================================
-- MIGRACIÓN: Corregir políticas de storage para bucket shops
-- =====================================================
-- Este script corrige el problema de Error 400 Bad Request
-- al acceder a imágenes del bucket 'shops'
-- =====================================================

-- 1. Verificar si el bucket 'shops' existe
SELECT
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'shops';

-- 2. Actualizar bucket para asegurarnos que sea público
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/PNG', 'image/JPG', 'image/JPEG']
WHERE id = 'shops';

-- 3. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Public Access Shops" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload shops" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update shops" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete shops" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to shops" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to shops" ON storage.objects;

-- 4. Crear política para acceso público (LECTURA) - permite a TODOS ver las imágenes
CREATE POLICY "Public Access Shops"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shops');

-- 5. Crear política para que usuarios AUTENTICADOS puedan subir
CREATE POLICY "Authenticated users can upload shops"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shops');

-- 6. Crear política para que usuarios AUTENTICADOS puedan actualizar
CREATE POLICY "Authenticated users can update shops"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shops')
WITH CHECK (bucket_id = 'shops');

-- 7. Crear política para que usuarios AUTENTICADOS puedan eliminar
CREATE POLICY "Authenticated users can delete shops"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shops');

-- 8. Verificar que las políticas se crearon correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%shops%'
  OR policyname LIKE '%Shops%';

-- 9. Verificar que el bucket sea público
SELECT
  id,
  name,
  public,
  CASE
    WHEN public = true THEN '✅ Bucket es PÚBLICO - Las imágenes deberían ser accesibles'
    ELSE '❌ Bucket es PRIVADO - Necesita ser público'
  END as status
FROM storage.buckets
WHERE id = 'shops';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. El bucket 'shops' DEBE ser público (public = true)
-- 2. Las políticas permiten lectura pública (TO public)
-- 3. Solo usuarios autenticados pueden subir/modificar/eliminar
-- 4. Las extensiones PNG, JPG, etc. se aceptan en mayúsculas y minúsculas
--
-- DESPUÉS DE EJECUTAR ESTA MIGRACIÓN:
-- - Las URLs como https://raylqjmjdlojgkggvenq.supabase.co/storage/v1/object/public/shops/xxx/imagen.PNG
--   deberían funcionar correctamente
-- - No debería aparecer el error 400 Bad Request
-- =====================================================
