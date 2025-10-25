-- ============================================================================
-- MIGRACIÓN: Verificar y arreglar trigger de creación de perfiles
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Problema: Trigger puede no estar funcionando correctamente
-- Solución: Recrear trigger para asegurar que funciona
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar si el trigger existe
-- ============================================================================

SELECT 
  '🔍 VERIFICACIÓN DE TRIGGER' as status,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- PASO 2: Eliminar trigger anterior si existe
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- PASO 3: Eliminar función anterior si existe
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================================
-- PASO 4: Crear función mejorada
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'type', 'patient'),
    true, -- account_active por defecto
    NULL, -- deactivated_at
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si el perfil ya existe, no hacer nada
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error pero no fallar
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 5: Crear trigger
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PASO 6: Verificar que el trigger se creó correctamente
-- ============================================================================

SELECT 
  '✅ TRIGGER CREADO' as status,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- PASO 7: Verificar función
-- ============================================================================

SELECT 
  '✅ FUNCIÓN CREADA' as status,
  proname as nombre_funcion,
  prosecdef as security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger que crea automáticamente un perfil en public.profiles cuando se crea un nuevo usuario en auth.users. Incluye manejo de errores para evitar fallos en la creación de usuarios.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Ejecuta handle_new_user() después de insertar un nuevo usuario para crear su perfil automáticamente.';

