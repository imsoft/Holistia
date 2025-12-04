-- =====================================================
-- Verificar políticas RLS de la tabla shops
-- =====================================================

-- 1. Ver todas las políticas de la tabla shops
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'shops'
ORDER BY policyname;

-- 2. Verificar si RLS está habilitado en la tabla
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'shops';

-- 3. Probar query como usuario anónimo (simular lo que hace la app)
-- Esto debería devolver los shops activos
SELECT
  id,
  name,
  image_url,
  is_active
FROM shops
WHERE is_active = true;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deberías ver políticas que permitan a usuarios
-- anónimos (anon) o autenticados (authenticated)
-- ver los shops activos
-- =====================================================
