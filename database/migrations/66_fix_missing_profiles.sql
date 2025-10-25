-- ============================================================================
-- MIGRACIÓN: Crear perfiles faltantes para usuarios existentes
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Problema: Usuarios en auth.users sin perfil en profiles
-- Solución: Crear perfiles para todos los usuarios sin perfil
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar usuarios sin perfil
-- ============================================================================

SELECT 
  '⚠️ USUARIOS SIN PERFIL ANTES DE CORRECCIÓN' as status,
  COUNT(*) as total
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ============================================================================
-- PASO 2: Crear perfiles para usuarios sin perfil
-- ============================================================================

INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  avatar_url,
  type,
  account_active,
  deactivated_at,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name,
  u.raw_user_meta_data->>'phone' as phone,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  COALESCE(u.raw_user_meta_data->>'type', 'patient') as type,
  true as account_active,
  NULL as deactivated_at,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ============================================================================
-- PASO 3: Verificar que se crearon todos
-- ============================================================================

SELECT 
  '✅ USUARIOS SIN PERFIL DESPUÉS DE CORRECCIÓN' as status,
  COUNT(*) as total
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Debería ser 0

-- ============================================================================
-- PASO 4: Verificar totales
-- ============================================================================

SELECT 
  '📊 VERIFICACIÓN FINAL' as status,
  (SELECT COUNT(*) FROM auth.users) as usuarios_auth,
  (SELECT COUNT(*) FROM profiles) as perfiles,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM profiles) as diferencia;

-- Diferencia debería ser 0

-- ============================================================================
-- PASO 5: Listar perfiles recién creados
-- ============================================================================

SELECT 
  '✅ PERFILES RECIÉN CREADOS' as status,
  id,
  email,
  COALESCE(first_name || ' ' || last_name, email) as nombre,
  type,
  account_active,
  created_at
FROM profiles
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;

