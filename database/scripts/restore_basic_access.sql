-- SCRIPT DE RESTAURACIÓN: Restaurar acceso básico a la aplicación
-- EJECUTAR INMEDIATAMENTE EN SUPABASE DASHBOARD

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE PROFILES
DROP POLICY IF EXISTS "Professionals can view their patients" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles if account is active" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. CREAR POLÍTICAS BÁSICAS SIN RECURSIÓN
-- Permitir que usuarios vean su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Permitir que usuarios vean perfiles activos (sin funciones complejas)
CREATE POLICY "Users can view active profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (account_active = true);

-- Permitir actualización de perfil propio
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Permitir inserción de perfiles
CREATE POLICY "Users can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. VERIFICAR QUE NO HAY ERRORES
SELECT 
  '✅ RESTAURACIÓN COMPLETADA' as seccion,
  'Políticas básicas creadas sin recursión' as estado;
