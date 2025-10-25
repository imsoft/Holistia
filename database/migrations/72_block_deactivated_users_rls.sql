-- ============================================================================
-- MIGRACIÓN: Bloquear acceso de usuarios desactivados mediante RLS
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

-- Política 1: Los usuarios pueden ver su propio perfil SI su cuenta está activa
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  AND (
    -- Permitir ver el perfil aunque esté desactivado (para mostrar el mensaje)
    -- PERO el middleware bloqueará el acceso
    true
  )
);

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

-- Eliminar política existente
DROP POLICY IF EXISTS "Users can view own professional applications" ON professional_applications;

-- Solo usuarios con cuenta activa pueden ver sus aplicaciones
CREATE POLICY "Users can view own professional applications"
ON professional_applications FOR SELECT
USING (
  user_id = auth.uid()
  AND public.is_account_active()
);

-- ============================================================================
-- PASO 4: Actualizar políticas de appointments
-- ============================================================================

-- Pacientes solo pueden ver sus citas si su cuenta está activa
DROP POLICY IF EXISTS "Patients can view their appointments" ON appointments;

CREATE POLICY "Patients can view their appointments"
ON appointments FOR SELECT
USING (
  patient_id = auth.uid()
  AND public.is_account_active()
);

-- Profesionales solo pueden ver sus citas si su cuenta está activa
DROP POLICY IF EXISTS "Professionals can view their appointments" ON appointments;

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

-- ============================================================================
-- PASO 5: Actualizar políticas de payments
-- ============================================================================

-- Solo usuarios con cuenta activa pueden ver sus pagos
DROP POLICY IF EXISTS "Users can view own payments" ON payments;

CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (
  user_id = auth.uid()
  AND public.is_account_active()
);

-- ============================================================================
-- PASO 6: Actualizar políticas de event_registrations
-- ============================================================================

-- Solo usuarios con cuenta activa pueden ver sus registros
DROP POLICY IF EXISTS "Users can view own event registrations" ON event_registrations;

CREATE POLICY "Users can view own event registrations"
ON event_registrations FOR SELECT
USING (
  user_id = auth.uid()
  AND public.is_account_active()
);

-- ============================================================================
-- PASO 7: Actualizar políticas de user_favorites
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;

CREATE POLICY "Users can view own favorites"
ON user_favorites FOR SELECT
USING (
  user_id = auth.uid()
  AND public.is_account_active()
);

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

-- Ver políticas actualizadas
SELECT
  '✅ POLÍTICAS ACTUALIZADAS' as estado,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    tablename IN ('profiles', 'professional_applications', 'appointments', 'payments', 'event_registrations', 'user_favorites')
  )
ORDER BY tablename, policyname;

-- Probar la función
SELECT
  '🧪 PRUEBA FUNCIÓN' as test,
  public.is_account_active() as mi_cuenta_esta_activa;

-- Ver usuarios desactivados (solo para admins)
SELECT
  '📋 USUARIOS DESACTIVADOS' as reporte,
  id,
  email,
  account_active,
  deactivated_at
FROM profiles
WHERE account_active = false
ORDER BY deactivated_at DESC;
