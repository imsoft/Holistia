-- ============================================================================
-- VERIFICACIÓN COMPLETA DE PROFILES POST-MIGRACIÓN
-- ============================================================================
-- Ejecutar en: Supabase SQL Editor
-- Propósito: Verificar estado de todos los perfiles migrados
-- ============================================================================

-- 1. Conteo total
SELECT '1. CONTEO TOTAL' as seccion, '' as metrica, '' as valor
UNION ALL
SELECT 
  '',
  'Usuarios en auth.users',
  COUNT(*)::text
FROM auth.users
UNION ALL
SELECT 
  '',
  'Perfiles en profiles',
  COUNT(*)::text
FROM profiles
UNION ALL
SELECT 
  '',
  'Usuarios sin perfil',
  COUNT(*)::text
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL
SELECT '', '', ''

-- 2. Distribución por tipo
UNION ALL
SELECT '2. DISTRIBUCIÓN POR TIPO', '', ''
UNION ALL
SELECT 
  '',
  'Admins',
  COUNT(*)::text || ' usuarios'
FROM profiles
WHERE type = 'admin'
UNION ALL
SELECT 
  '',
  'Profesionales',
  COUNT(*)::text || ' usuarios'
FROM profiles
WHERE type = 'professional'
UNION ALL
SELECT 
  '',
  'Pacientes',
  COUNT(*)::text || ' usuarios'
FROM profiles
WHERE type = 'patient'
UNION ALL
SELECT 
  '',
  'Sin tipo definido',
  COUNT(*)::text || ' usuarios'
FROM profiles
WHERE type IS NULL

UNION ALL
SELECT '', '', ''

-- 3. Estado de nombres
UNION ALL
SELECT '3. ESTADO DE NOMBRES', '', ''
UNION ALL
SELECT 
  '',
  'Con nombres completos',
  COUNT(*)::text || ' usuarios (' || 
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM profiles), 0), 1)::text || '%)'
FROM profiles
WHERE first_name IS NOT NULL 
  AND first_name != '' 
  AND last_name IS NOT NULL 
  AND last_name != ''
UNION ALL
SELECT 
  '',
  'Sin nombres (OAuth/Google)',
  COUNT(*)::text || ' usuarios (' || 
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM profiles), 0), 1)::text || '%)'
FROM profiles
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
UNION ALL
SELECT 
  '',
  'Nombres parciales',
  COUNT(*)::text || ' usuarios'
FROM profiles
WHERE (
  (first_name IS NOT NULL AND first_name != '' AND (last_name IS NULL OR last_name = ''))
  OR
  ((first_name IS NULL OR first_name = '') AND last_name IS NOT NULL AND last_name != '')
)

UNION ALL
SELECT '', '', ''

-- 4. Estado de otros campos
UNION ALL
SELECT '4. OTROS CAMPOS', '', ''
UNION ALL
SELECT 
  '',
  'Con teléfono',
  COUNT(*)::text || ' usuarios'
FROM profiles
WHERE phone IS NOT NULL AND phone != ''
UNION ALL
SELECT 
  '',
  'Con avatar',
  COUNT(*)::text || ' usuarios'
FROM profiles
WHERE avatar_url IS NOT NULL AND avatar_url != ''

UNION ALL
SELECT '', '', ''

-- 5. Usuarios recientes (últimos 5)
UNION ALL
SELECT '5. USUARIOS RECIENTES', '', ''
UNION ALL
SELECT '', '', '';

-- Mostrar últimos 5 usuarios
SELECT 
  '  → ' || email as usuario,
  COALESCE(first_name || ' ' || last_name, email) as nombre,
  type as tipo,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as creado
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

