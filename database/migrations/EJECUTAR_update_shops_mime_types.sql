-- =====================================================
-- MIGRACIÓN: Actualizar tipos MIME del bucket shops
-- =====================================================
-- Este script solo actualiza los tipos MIME permitidos
-- para incluir extensiones en mayúsculas (.PNG, .JPG)
-- =====================================================

-- 1. Verificar configuración actual del bucket
SELECT
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'shops';

-- 2. Actualizar tipos MIME permitidos para incluir mayúsculas
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/PNG',
    'image/JPG',
    'image/JPEG',
    'image/WEBP',
    'application/pdf'
  ]
WHERE id = 'shops';

-- 3. Verificar que se actualizó correctamente
SELECT
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  CASE
    WHEN public = true THEN '✅ Bucket es PÚBLICO'
    ELSE '❌ Bucket es PRIVADO'
  END as status
FROM storage.buckets
WHERE id = 'shops';

-- 4. Verificar políticas existentes (solo lectura, no modifica nada)
SELECT
  policyname,
  cmd,
  roles::text[],
  CASE
    WHEN policyname ILIKE '%public%' AND cmd = 'SELECT' AND 'public' = ANY(roles::text[])
    THEN '✅ Política pública de lectura correcta'
    ELSE '✔️ Política configurada'
  END as status
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname ILIKE '%shops%' OR policyname ILIKE '%Shop%')
ORDER BY policyname;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- El bucket 'shops' ahora aceptará archivos con extensiones
-- tanto en minúsculas (.png, .jpg) como en MAYÚSCULAS (.PNG, .JPG)
--
-- Las políticas existentes NO se modifican
-- =====================================================
