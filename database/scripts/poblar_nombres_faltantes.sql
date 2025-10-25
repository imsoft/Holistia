-- ============================================================================
-- POBLAR NOMBRES FALTANTES EN PROFILES
-- ============================================================================
-- Ejecutar en: Supabase SQL Editor
-- Propósito: Intentar poblar first_name y last_name desde diferentes fuentes
-- IMPORTANTE: Este script es OPCIONAL, solo si quieres tener nombres completos
-- ============================================================================

-- PASO 1: Verificar usuarios sin nombres
SELECT 
  '📊 USUARIOS SIN NOMBRES ANTES DE CORRECCIÓN' as status,
  COUNT(*) as total
FROM profiles
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '');

-- PASO 2: Intentar poblar desde raw_user_meta_data.full_name
UPDATE profiles
SET 
  first_name = COALESCE(
    NULLIF(TRIM(SPLIT_PART((
      SELECT u.raw_user_meta_data->>'full_name'
      FROM auth.users u
      WHERE u.id = profiles.id
    ), ' ', 1)), ''),
    first_name
  ),
  last_name = COALESCE(
    NULLIF(TRIM(SPLIT_PART((
      SELECT u.raw_user_meta_data->>'full_name'
      FROM auth.users u
      WHERE u.id = profiles.id
    ), ' ', 2)), ''),
    last_name
  ),
  updated_at = NOW()
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = profiles.id
    AND u.raw_user_meta_data->>'full_name' IS NOT NULL
    AND u.raw_user_meta_data->>'full_name' != ''
  );

-- PASO 3: Intentar poblar desde raw_user_meta_data.name
UPDATE profiles
SET 
  first_name = COALESCE(
    NULLIF(TRIM(SPLIT_PART((
      SELECT u.raw_user_meta_data->>'name'
      FROM auth.users u
      WHERE u.id = profiles.id
    ), ' ', 1)), ''),
    first_name
  ),
  last_name = COALESCE(
    NULLIF(TRIM(SPLIT_PART((
      SELECT u.raw_user_meta_data->>'name'
      FROM auth.users u
      WHERE u.id = profiles.id
    ), ' ', 2)), ''),
    last_name
  ),
  updated_at = NOW()
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = profiles.id
    AND u.raw_user_meta_data->>'name' IS NOT NULL
    AND u.raw_user_meta_data->>'name' != ''
  );

-- PASO 4: Para usuarios de Google sin nombre, usar email como nombre
-- (SOLO si aún no tienen nombre después de los pasos anteriores)
UPDATE profiles
SET 
  first_name = SPLIT_PART(email, '@', 1),
  updated_at = NOW()
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
  AND avatar_url LIKE '%googleusercontent.com%'; -- Solo usuarios de Google

-- PASO 5: Verificar resultado
SELECT 
  '✅ USUARIOS SIN NOMBRES DESPUÉS DE CORRECCIÓN' as status,
  COUNT(*) as total
FROM profiles
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '');

-- PASO 6: Mostrar usuarios que aún no tienen nombres
SELECT 
  '⚠️ USUARIOS QUE AÚN NO TIENEN NOMBRES COMPLETOS' as info,
  '' as separador;

SELECT 
  email,
  first_name,
  last_name,
  type,
  avatar_url
FROM profiles
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
ORDER BY created_at DESC;

