-- ============================================================================
-- SCRIPT: Verificar políticas de storage para digital-products
-- ============================================================================
-- Propósito: Diagnosticar problemas con políticas RLS del bucket digital-products
-- ============================================================================

-- 1. Verificar que el bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at,
  CASE 
    WHEN id = 'digital-products' THEN '✅ Bucket existe'
    ELSE '❌ Bucket no existe'
  END as estado
FROM storage.buckets
WHERE id = 'digital-products';

-- 2. Listar todas las políticas del bucket digital-products
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Con USING'
    ELSE '❌ Sin USING'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Con WITH CHECK'
    ELSE '❌ Sin WITH CHECK'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%digital-products%'
ORDER BY policyname, cmd;

-- 3. Verificar el estado del admin actual
SELECT 
  id,
  type,
  account_active,
  CASE 
    WHEN type = 'admin' AND account_active = true THEN '✅ Admin activo'
    WHEN type = 'admin' AND account_active = false THEN '⚠️ Admin inactivo'
    WHEN type != 'admin' THEN '❌ No es admin'
    ELSE '❓ Estado desconocido'
  END as estado_admin
FROM public.profiles
WHERE id = auth.uid();

-- 4. Verificar si el admin puede subir archivos (test de la política)
-- Esta consulta simula la verificación que hace la política de INSERT
SELECT 
  auth.uid() as user_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    ) THEN '✅ Admin puede subir (según política)'
    ELSE '❌ Admin NO puede subir (según política)'
  END as resultado_politica_admin,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.professional_applications
      WHERE professional_applications.user_id = auth.uid()
      AND professional_applications.status = 'approved'
    ) THEN '✅ Profesional aprobado puede subir'
    ELSE '❌ No es profesional aprobado'
  END as resultado_politica_profesional;

-- 5. Mostrar la expresión completa de la política de INSERT
SELECT 
  policyname,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname = 'Authenticated users can upload to digital-products'
  AND cmd = 'INSERT';
