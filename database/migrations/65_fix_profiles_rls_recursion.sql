-- ============================================================================
-- MIGRACIÓN DE EMERGENCIA: Arreglar recursión infinita en profiles RLS
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Problema: Las políticas de profiles crean recursión infinita
-- Solución: Usar auth.jwt() en lugar de SELECT en profiles
-- ============================================================================

-- ============================================================================
-- PASO 1: Eliminar todas las políticas problemáticas
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- ============================================================================
-- PASO 2: Crear políticas SIN recursión
-- ============================================================================

-- Política 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Política 2: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Política 3: Los admins pueden ver todos los perfiles
-- IMPORTANTE: Usamos auth.jwt() en lugar de SELECT en profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  -- Hardcoded admin email como fallback
  (auth.jwt() ->> 'email') = 'holistia.io@gmail.com'
  OR
  -- O verificar si el tipo es admin usando raw_user_meta_data (temporal)
  (auth.jwt() -> 'user_metadata' ->> 'type') = 'admin'
);

-- Política 4: Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  -- Hardcoded admin email como fallback
  (auth.jwt() ->> 'email') = 'holistia.io@gmail.com'
  OR
  -- O verificar si el tipo es admin usando raw_user_meta_data (temporal)
  (auth.jwt() -> 'user_metadata' ->> 'type') = 'admin'
);

-- Política 5: El sistema puede insertar perfiles (para el trigger)
CREATE POLICY "System can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- PASO 3: Crear función helper para verificar admin (sin recursión)
-- ============================================================================

-- Función que usa SECURITY DEFINER para evitar recursión
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'holistia.io@gmail.com'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'type') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 4: Actualizar políticas de admin para usar la función
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  '✅ POLÍTICAS ACTUALIZADAS' as estado,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public'
ORDER BY policyname;

-- Verificar función helper
SELECT 
  '✅ FUNCIÓN HELPER CREADA' as estado,
  proname as nombre_funcion,
  prosecdef as security_definer
FROM pg_proc
WHERE proname = 'is_admin';

-- ============================================================================
-- PRUEBA
-- ============================================================================

-- Intenta leer tu propio perfil (debería funcionar)
SELECT 
  '🧪 PRUEBA: Leer perfil propio' as test,
  id,
  email,
  type
FROM profiles
WHERE id = auth.uid()
LIMIT 1;

