-- ============================================================================
-- MIGRACIÓN: Setup para creación automática de perfiles (sin trigger)
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Problema: No podemos crear trigger en auth.users (requiere permisos owner)
-- Solución: Usar Database Webhook o función que se llama desde el frontend
-- ============================================================================

-- ============================================================================
-- OPCIÓN 1: Función para crear perfil (llamada desde frontend)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user(
  user_id UUID,
  user_email TEXT,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  phone TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL,
  user_type TEXT DEFAULT 'patient'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar si el perfil ya existe
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'profile_id', user_id
    );
  END IF;

  -- Crear el perfil
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
  VALUES (
    user_id,
    user_email,
    COALESCE(first_name, ''),
    COALESCE(last_name, ''),
    phone,
    avatar_url,
    COALESCE(user_type, 'patient'),
    true,
    NULL,
    NOW(),
    NOW()
  );

  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', 'Profile created successfully',
    'profile_id', user_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'profile_id', user_id
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- OPCIÓN 2: Función que se auto-llama en el primer login
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  current_user_metadata JSONB;
  result JSON;
BEGIN
  -- Obtener ID del usuario actual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not authenticated'
    );
  END IF;

  -- Verificar si el perfil ya existe
  IF EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'profile_id', current_user_id
    );
  END IF;

  -- Obtener datos del usuario desde auth.users
  SELECT 
    email,
    raw_user_meta_data
  INTO 
    current_user_email,
    current_user_metadata
  FROM auth.users
  WHERE id = current_user_id;

  -- Crear el perfil
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
  VALUES (
    current_user_id,
    current_user_email,
    COALESCE(current_user_metadata->>'first_name', ''),
    COALESCE(current_user_metadata->>'last_name', ''),
    current_user_metadata->>'phone',
    current_user_metadata->>'avatar_url',
    COALESCE(current_user_metadata->>'type', 'patient'),
    true,
    NULL,
    NOW(),
    NOW()
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Profile created successfully',
    'profile_id', current_user_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'profile_id', current_user_id
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Permisos
-- ============================================================================

-- Permitir que usuarios autenticados llamen a estas funciones
GRANT EXECUTE ON FUNCTION public.create_profile_for_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists TO authenticated;

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON FUNCTION public.create_profile_for_new_user IS 
'Crea un perfil para un nuevo usuario. Se llama desde el frontend después de signup/OAuth.';

COMMENT ON FUNCTION public.ensure_profile_exists IS 
'Verifica y crea un perfil si no existe para el usuario actual. Se llama automáticamente en el primer login.';

-- ============================================================================
-- Verificación
-- ============================================================================

SELECT 
  '✅ FUNCIONES CREADAS' as status,
  proname as nombre_funcion,
  prosecdef as security_definer
FROM pg_proc
WHERE proname IN ('create_profile_for_new_user', 'ensure_profile_exists')
ORDER BY proname;

