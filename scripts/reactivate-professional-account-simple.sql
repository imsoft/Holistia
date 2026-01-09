-- ============================================================================
-- Script SQL SIMPLE para reactivar cuenta de profesional
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Reemplaza 'ryoga.chan.78@gmail.com' con el email del profesional
-- 2. Copia y pega este script en Supabase Dashboard → SQL Editor
-- 3. Ejecuta el script
-- ============================================================================

-- ============================================================================
-- OPCIÓN 1: Usar la función RPC (RECOMENDADO)
-- ============================================================================
DO $$
DECLARE
  user_email TEXT := 'ryoga.chan.78@gmail.com'; -- ⚠️ CAMBIAR ESTE EMAIL
  user_id_found UUID;
BEGIN
  -- Buscar el user_id por email
  SELECT id INTO user_id_found
  FROM profiles
  WHERE email = user_email;

  IF user_id_found IS NULL THEN
    RAISE EXCEPTION '❌ No se encontró usuario con email: %', user_email;
  END IF;

  -- Reactivar usando la función
  PERFORM reactivate_user_account(user_id_found);
  
  RAISE NOTICE '✅ Cuenta reactivada exitosamente para: %', user_email;
END $$;

-- ============================================================================
-- OPCIÓN 2: SQL Directo (si la función RPC no funciona)
-- ============================================================================
-- Descomenta este bloque si la opción 1 falla:

/*
DO $$
DECLARE
  user_id_found UUID;
BEGIN
  -- Obtener user_id
  SELECT id INTO user_id_found
  FROM profiles
  WHERE email = 'ryoga.chan.78@gmail.com';

  IF user_id_found IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Reactivar en profiles
  UPDATE profiles
  SET account_active = true,
      deactivated_at = NULL,
      updated_at = NOW()
  WHERE id = user_id_found;

  -- Reactivar en auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{account_active}',
        'true'::jsonb
      ),
      updated_at = NOW()
  WHERE id = user_id_found;

  -- Reactivar aplicación profesional si existe
  UPDATE professional_applications
  SET is_active = true,
      updated_at = NOW()
  WHERE user_id = user_id_found
    AND status = 'approved';

  RAISE NOTICE '✅ Cuenta reactivada: %', user_id_found;
END $$;
*/

-- ============================================================================
-- VERIFICAR RESULTADO
-- ============================================================================
SELECT 
  email,
  account_active,
  deactivated_at,
  CASE 
    WHEN account_active = true THEN '✅ ACTIVA'
    ELSE '❌ DESACTIVADA'
  END as estado
FROM profiles
WHERE email = 'ryoga.chan.78@gmail.com';
