-- ============================================================================
-- MIGRACIÓN: Diagnóstico de perfiles faltantes
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Identificar usuarios sin perfil y crear perfiles si faltan
-- ============================================================================

-- ============================================================================
-- PASO 1: Listar usuarios sin perfil
-- ============================================================================

SELECT 
  '⚠️ USUARIOS SIN PERFIL EN profiles' as diagnostico,
  u.id,
  u.email,
  u.created_at as created_at_auth,
  COALESCE(p.id, 'NO TIENE PERFIL') as profile_id,
  u.raw_user_meta_data->>'first_name' as first_name_metadata,
  u.raw_user_meta_data->>'last_name' as last_name_metadata,
  u.raw_user_meta_data->>'type' as type_metadata
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- PASO 2: Crear perfiles para usuarios sin perfil (si hay alguno)
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
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PASO 3: Verificar resultado
-- ============================================================================

SELECT 
  '✅ VERIFICACIÓN FINAL' as diagnostico,
  (SELECT COUNT(*) FROM auth.users) as total_usuarios_auth,
  (SELECT COUNT(*) FROM profiles) as total_perfiles,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM profiles) as usuarios_sin_perfil,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
    THEN '✅ TODOS LOS USUARIOS TIENEN PERFIL'
    ELSE '❌ HAY USUARIOS SIN PERFIL'
  END as estado;

-- ============================================================================
-- PASO 4: Listar los últimos 5 perfiles creados
-- ============================================================================

SELECT 
  '📋 ÚLTIMOS PERFILES' as diagnostico,
  id,
  email,
  first_name,
  last_name,
  type,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
