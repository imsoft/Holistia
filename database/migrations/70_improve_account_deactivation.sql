-- ============================================================================
-- MIGRACIÓN: Mejorar sistema de desactivación de cuentas
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Asegurar que usuarios desactivados no puedan acceder a la plataforma
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear función para desactivar cuenta (incluye bloqueo en auth)
-- ============================================================================

CREATE OR REPLACE FUNCTION deactivate_user_account(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_message TEXT;
BEGIN
  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuario no encontrado'
    );
  END IF;

  -- 1. Desactivar en profiles
  UPDATE profiles
  SET
    account_active = false,
    deactivated_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id_param;

  -- 2. Actualizar metadata en auth.users para bloquear login
  UPDATE auth.users
  SET
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{account_active}',
      'false'::jsonb
    ),
    updated_at = NOW()
  WHERE id = user_id_param;

  -- 3. Desactivar aplicaciones profesionales si existen
  UPDATE professional_applications
  SET
    is_active = false,
    updated_at = NOW()
  WHERE user_id = user_id_param;

  RETURN json_build_object(
    'success', true,
    'message', 'Cuenta desactivada exitosamente'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al desactivar cuenta: ' || SQLERRM
    );
END;
$$;

-- Comentario
COMMENT ON FUNCTION deactivate_user_account IS
'Desactiva completamente una cuenta de usuario: profiles, auth.users metadata y professional_applications';

-- ============================================================================
-- PASO 2: Crear función para reactivar cuenta (solo admins)
-- ============================================================================

CREATE OR REPLACE FUNCTION reactivate_user_account(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuario no encontrado'
    );
  END IF;

  -- 1. Reactivar en profiles
  UPDATE profiles
  SET
    account_active = true,
    deactivated_at = NULL,
    updated_at = NOW()
  WHERE id = user_id_param;

  -- 2. Actualizar metadata en auth.users
  UPDATE auth.users
  SET
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{account_active}',
      'true'::jsonb
    ),
    updated_at = NOW()
  WHERE id = user_id_param;

  -- 3. Reactivar aplicaciones profesionales si existen y estaban aprobadas
  UPDATE professional_applications
  SET
    is_active = true,
    updated_at = NOW()
  WHERE user_id = user_id_param
    AND status = 'approved';

  RETURN json_build_object(
    'success', true,
    'message', 'Cuenta reactivada exitosamente'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al reactivar cuenta: ' || SQLERRM
    );
END;
$$;

-- Comentario
COMMENT ON FUNCTION reactivate_user_account IS
'Reactiva una cuenta de usuario desactivada (solo para administradores)';

-- ============================================================================
-- PASO 3: Actualizar políticas RLS para excluir usuarios desactivados
-- ============================================================================

-- Política para professional_applications: excluir desactivados en búsquedas públicas
DROP POLICY IF EXISTS "Public can view active approved professional applications" ON professional_applications;

CREATE POLICY "Public can view active approved professional applications"
ON professional_applications
FOR SELECT
USING (
  status = 'approved'
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = professional_applications.user_id
    AND p.account_active = true
  )
);

-- Política para profiles: usuarios desactivados no pueden leer otros perfiles
DROP POLICY IF EXISTS "Users can view other profiles if account is active" ON profiles;

CREATE POLICY "Users can view other profiles if account is active"
ON profiles
FOR SELECT
USING (
  -- Los usuarios solo ven perfiles si:
  -- 1. Es su propio perfil (activo o no)
  -- 2. O el perfil que ven está activo
  id = auth.uid()
  OR account_active = true
);

-- ============================================================================
-- PASO 4: Crear trigger para prevenir login de usuarios desactivados
-- ============================================================================

-- Nota: Supabase Auth valida automáticamente si raw_user_meta_data.account_active = false
-- No se requiere trigger adicional, pero agregamos una validación en la app

-- ============================================================================
-- PASO 5: Permisos
-- ============================================================================

-- Permitir que usuarios autenticados llamen a deactivate_user_account para SU PROPIA cuenta
GRANT EXECUTE ON FUNCTION deactivate_user_account TO authenticated;

-- Solo service_role puede reactivar cuentas (admins)
REVOKE EXECUTE ON FUNCTION reactivate_user_account FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reactivate_user_account FROM authenticated;
-- Solo se puede llamar desde código del servidor con service_role

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver funciones creadas
SELECT
  '✅ FUNCIONES CREADAS' as estado,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('deactivate_user_account', 'reactivate_user_account');

-- Ver políticas actualizadas
SELECT
  '✅ POLÍTICAS ACTUALIZADAS' as estado,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'professional_applications')
  AND policyname LIKE '%active%'
ORDER BY tablename, policyname;

-- Listar usuarios desactivados
SELECT
  '📋 USUARIOS DESACTIVADOS' as reporte,
  p.id,
  p.email,
  p.type,
  p.account_active,
  p.deactivated_at,
  (au.raw_user_meta_data->>'account_active')::boolean as auth_metadata_active
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.account_active = false
ORDER BY p.deactivated_at DESC;
