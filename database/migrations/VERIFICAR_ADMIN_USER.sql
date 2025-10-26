-- Script para verificar si tu usuario tiene permisos de admin correctamente configurados

-- 1. Ver tu información de usuario actual (ejecuta esto estando logueado)
SELECT
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'type' as user_type
FROM auth.users
WHERE id = auth.uid();

-- 2. Ver TODOS los usuarios admin en el sistema
SELECT
  id,
  email,
  raw_user_meta_data->>'type' as user_type,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'type' IN ('admin', 'Admin')
ORDER BY created_at DESC;

-- 3. Ver todas las políticas RLS en professional_applications
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
WHERE tablename = 'professional_applications';

-- 4. SOLO SI NECESITAS HACER A UN USUARIO ADMIN (reemplaza el email):
-- IMPORTANTE: Descomenta y modifica esta línea solo si necesitas hacer admin a un usuario
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{type}',
--   '"admin"'
-- )
-- WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
