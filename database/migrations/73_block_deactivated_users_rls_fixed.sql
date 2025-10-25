-- ============================================================================
-- MIGRACIÓN: Bloquear acceso de usuarios desactivados mediante RLS (CORREGIDO)
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Prevenir que usuarios desactivados accedan a cualquier dato
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear función para verificar si el usuario actual está activo
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS BOOLEAN AS $$
BEGIN
  -- Si no hay usuario autenticado, retornar false
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar si la cuenta está activa en profiles
  -- Usar EXISTS para evitar recursión
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND account_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_account_active IS
'Verifica si la cuenta del usuario autenticado está activa. Retorna false para usuarios desactivados.';

-- ============================================================================
-- PASO 2: Actualizar políticas de profiles
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;

-- Política 1: Los usuarios pueden ver su propio perfil (incluso si está desactivado para mostrar mensaje)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Política 2: Solo usuarios con cuenta activa pueden ver otros perfiles
CREATE POLICY "Users can view other profiles"
ON profiles FOR SELECT
USING (
  -- Los admins pueden ver todos
  public.is_admin()
  OR
  -- Los usuarios activos pueden ver perfiles activos
  (
    public.is_account_active()
    AND account_active = true
  )
);

-- Política 3: Solo usuarios con cuenta activa pueden actualizar su perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (
  auth.uid() = id
  AND public.is_account_active()
);

-- Política 4: Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (public.is_admin());

-- ============================================================================
-- PASO 3: Actualizar políticas de professional_applications
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own professional applications" ON professional_applications;
DROP POLICY IF EXISTS "Professionals can view own applications" ON professional_applications;

-- Solo usuarios con cuenta activa pueden ver sus aplicaciones
CREATE POLICY "Users can view own professional applications"
ON professional_applications FOR SELECT
USING (
  user_id = auth.uid()
  AND public.is_account_active()
);

-- ============================================================================
-- PASO 4: Verificar y actualizar políticas de appointments (si existe la tabla)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "Patients can view their appointments" ON appointments;
    DROP POLICY IF EXISTS "Professionals can view their appointments" ON appointments;

    -- Crear nuevas políticas solo si la tabla tiene la columna patient_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'patient_id'
    ) THEN
      CREATE POLICY "Patients can view their appointments"
      ON appointments FOR SELECT
      USING (
        patient_id = auth.uid()
        AND public.is_account_active()
      );
    END IF;

    -- Crear política para profesionales
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'professional_id'
    ) THEN
      CREATE POLICY "Professionals can view their appointments"
      ON appointments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM professional_applications pa
          WHERE pa.user_id = auth.uid()
          AND pa.id = appointments.professional_id
        )
        AND public.is_account_active()
      );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PASO 5: Verificar y actualizar políticas de payments (si existe)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    DROP POLICY IF EXISTS "Users can view own payments" ON payments;

    -- Verificar si la tabla tiene user_id o patient_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'user_id'
    ) THEN
      CREATE POLICY "Users can view own payments"
      ON payments FOR SELECT
      USING (
        user_id = auth.uid()
        AND public.is_account_active()
      );
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'patient_id'
    ) THEN
      CREATE POLICY "Users can view own payments"
      ON payments FOR SELECT
      USING (
        patient_id = auth.uid()
        AND public.is_account_active()
      );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PASO 6: Verificar y actualizar políticas de event_registrations (si existe)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') THEN
    DROP POLICY IF EXISTS "Users can view own event registrations" ON event_registrations;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'event_registrations' AND column_name = 'user_id'
    ) THEN
      CREATE POLICY "Users can view own event registrations"
      ON event_registrations FOR SELECT
      USING (
        user_id = auth.uid()
        AND public.is_account_active()
      );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PASO 7: Verificar y actualizar políticas de user_favorites (si existe)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
    DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_favorites' AND column_name = 'user_id'
    ) THEN
      CREATE POLICY "Users can view own favorites"
      ON user_favorites FOR SELECT
      USING (
        user_id = auth.uid()
        AND public.is_account_active()
      );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver función creada
SELECT
  '✅ FUNCIÓN CREADA' as estado,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_account_active';

-- Ver políticas actualizadas en profiles (la más importante)
SELECT
  '✅ POLÍTICAS DE PROFILES' as estado,
  policyname,
  cmd,
  LEFT(qual::text, 100) as condicion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- Probar la función con el usuario actual
SELECT
  '🧪 PRUEBA FUNCIÓN' as test,
  public.is_account_active() as mi_cuenta_esta_activa;

-- Ver usuarios desactivados
SELECT
  '📋 USUARIOS DESACTIVADOS' as reporte,
  id,
  email,
  account_active,
  deactivated_at
FROM profiles
WHERE account_active = false
ORDER BY deactivated_at DESC;
