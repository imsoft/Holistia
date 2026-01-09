-- ============================================================================
-- REACTIVAR CUENTA DE PROFESIONAL - Script SQL Simple
-- ============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza 'ryoga.chan.78@gmail.com' con el email del profesional (línea 15)
-- 2. Copia y pega en Supabase Dashboard → SQL Editor
-- 3. Ejecuta (Run)
-- 
-- ============================================================================

-- Reactivar cuenta usando función RPC
DO $$
DECLARE
  user_email TEXT := 'ryoga.chan.78@gmail.com'; -- ⚠️ CAMBIAR ESTE EMAIL
  user_id_found UUID;
BEGIN
  -- Buscar usuario por email
  SELECT id INTO user_id_found
  FROM profiles
  WHERE email = user_email;

  IF user_id_found IS NULL THEN
    RAISE EXCEPTION '❌ Usuario no encontrado con email: %', user_email;
  END IF;

  -- Reactivar cuenta
  PERFORM reactivate_user_account(user_id_found);
  
  RAISE NOTICE '✅ Cuenta reactivada exitosamente para: %', user_email;
END $$;

-- Verificar resultado
SELECT 
  email,
  account_active,
  CASE WHEN account_active THEN '✅ ACTIVA' ELSE '❌ DESACTIVADA' END as estado,
  deactivated_at
FROM profiles
WHERE email = 'ryoga.chan.78@gmail.com'; -- ⚠️ CAMBIAR ESTE EMAIL TAMBIÉN
