-- ============================================================================
-- Script SQL para reactivar cuenta de profesional desactivado
-- ============================================================================
-- Uso: Ejecutar este script en Supabase Dashboard → SQL Editor
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza 'ryoga.chan.78@gmail.com' con el email del profesional
-- 2. Ejecuta el script completo
-- 3. Verifica los resultados
-- ============================================================================

-- ============================================================================
-- PASO 1: Buscar el usuario por email
-- ============================================================================
DO $$
DECLARE
  user_email TEXT := 'ryoga.chan.78@gmail.com'; -- ⚠️ CAMBIAR ESTE EMAIL
  user_id_found UUID;
  account_active_status BOOLEAN;
  deactivated_at_date TIMESTAMPTZ;
  user_type TEXT;
  professional_id UUID;
  professional_status TEXT;
  professional_is_active BOOLEAN;
BEGIN
  -- Buscar el usuario en profiles
  SELECT 
    id, 
    email, 
    account_active, 
    deactivated_at,
    type
  INTO 
    user_id_found,
    user_email,
    account_active_status,
    deactivated_at_date,
    user_type
  FROM profiles
  WHERE email = user_email;

  -- Verificar si se encontró el usuario
  IF user_id_found IS NULL THEN
    RAISE EXCEPTION '❌ No se encontró ningún usuario con el email: %', user_email;
  END IF;

  -- Mostrar información del usuario encontrado
  RAISE NOTICE '✅ Usuario encontrado:';
  RAISE NOTICE '   ID: %', user_id_found;
  RAISE NOTICE '   Email: %', user_email;
  RAISE NOTICE '   Type: %', COALESCE(user_type, 'N/A');
  RAISE NOTICE '   account_active: %', account_active_status;
  RAISE NOTICE '   deactivated_at: %', COALESCE(deactivated_at_date::TEXT, 'N/A');

  -- Verificar si es profesional
  SELECT 
    id,
    status,
    is_active
  INTO 
    professional_id,
    professional_status,
    professional_is_active
  FROM professional_applications
  WHERE user_id = user_id_found
  LIMIT 1;

  IF professional_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '👨‍⚕️  Aplicación profesional encontrada:';
    RAISE NOTICE '   ID: %', professional_id;
    RAISE NOTICE '   Status: %', professional_status;
    RAISE NOTICE '   is_active: %', professional_is_active;
  END IF;

  -- Verificar si ya está activo
  IF account_active_status = true THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ La cuenta ya está activa. No se requiere acción.';
    RETURN;
  END IF;

  -- ============================================================================
  -- PASO 2: Reactivar la cuenta usando la función existente
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Reactivando cuenta...';

  -- Usar la función reactivate_user_account si existe
  PERFORM reactivate_user_account(user_id_found);

  RAISE NOTICE '✅ Función reactivate_user_account ejecutada para: %', user_email;

END $$;

-- ============================================================================
-- PASO 3: Verificar el estado final
-- ============================================================================
SELECT 
  '📊 Estado Final' as seccion,
  p.id,
  p.email,
  p.account_active,
  p.deactivated_at,
  p.type,
  CASE 
    WHEN p.account_active = true THEN '✅ ACTIVA'
    ELSE '❌ DESACTIVADA'
  END as estado
FROM profiles p
WHERE p.email = 'ryoga.chan.78@gmail.com';

-- ============================================================================
-- ALTERNATIVA: Si la función RPC no funciona, usar este SQL directo
-- ============================================================================
-- Descomenta y ejecuta este bloque si la función RPC falla:

/*
DO $$
DECLARE
  user_id_found UUID;
BEGIN
  -- Obtener el user_id
  SELECT id INTO user_id_found
  FROM profiles
  WHERE email = 'ryoga.chan.78@gmail.com';

  IF user_id_found IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- 1. Reactivar en profiles
  UPDATE profiles
  SET
    account_active = true,
    deactivated_at = NULL,
    updated_at = NOW()
  WHERE id = user_id_found;

  -- 2. Actualizar metadata en auth.users
  UPDATE auth.users
  SET
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{account_active}',
      'true'::jsonb
    ),
    updated_at = NOW()
  WHERE id = user_id_found;

  -- 3. Reactivar aplicaciones profesionales si existen y estaban aprobadas
  UPDATE professional_applications
  SET
    is_active = true,
    updated_at = NOW()
  WHERE user_id = user_id_found
    AND status = 'approved';

  RAISE NOTICE '✅ Cuenta reactivada exitosamente para: %', user_id_found;
END $$;
*/

-- ============================================================================
-- VERIFICACIÓN FINAL: Ver todos los datos relacionados
-- ============================================================================
SELECT 
  '🔍 Verificación Completa' as tipo,
  p.email,
  p.account_active as profile_active,
  p.deactivated_at,
  (au.raw_user_meta_data->>'account_active')::boolean as auth_metadata_active,
  pa.status as professional_status,
  pa.is_active as professional_active
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN professional_applications pa ON pa.user_id = p.id
WHERE p.email = 'ryoga.chan.78@gmail.com';
