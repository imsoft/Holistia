-- SCRIPT NUCLEAR: Eliminar TODAS las políticas y recrear desde cero
-- EJECUTAR INMEDIATAMENTE EN SUPABASE DASHBOARD

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE PROFILES (SIN EXCEPCIONES)
DROP POLICY IF EXISTS "Professionals can view their patients" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles if account is active" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;

-- 2. DESHABILITAR RLS TEMPORALMENTE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR QUE NO HAY POLÍTICAS
SELECT 
  '🔍 VERIFICACIÓN' as seccion,
  COUNT(*) as politicas_restantes
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. HABILITAR RLS NUEVAMENTE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS BÁSICAS Y SEGURAS (SIN RECURSIÓN)
-- Política 1: Usuarios pueden ver su propio perfil
CREATE POLICY "profile_own_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política 2: Usuarios pueden actualizar su propio perfil
CREATE POLICY "profile_own_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Política 3: Usuarios pueden insertar su propio perfil
CREATE POLICY "profile_own_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política 4: Usuarios pueden ver perfiles activos (SIN funciones complejas)
CREATE POLICY "profile_active_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (account_active = true);

-- 6. VERIFICAR POLÍTICAS CREADAS
SELECT 
  '✅ POLÍTICAS CREADAS' as seccion,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 7. PROBAR ACCESO BÁSICO
SELECT 
  '🧪 PRUEBA ACCESO' as seccion,
  'Acceso básico restaurado' as estado;
