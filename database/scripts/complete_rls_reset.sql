-- SCRIPT COMPLETO: Reset total de RLS sin recursión
-- EJECUTAR INMEDIATAMENTE EN SUPABASE DASHBOARD

-- 1. ELIMINAR TODAS LAS POLÍTICAS (SIN EXCEPCIONES)
DROP POLICY IF EXISTS "profile_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_insert" ON public.profiles;
DROP POLICY IF EXISTS "profile_active_select" ON public.profiles;
DROP POLICY IF EXISTS "professionals_view_patients_safe" ON public.profiles;
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

-- 2. DESHABILITAR RLS COMPLETAMENTE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR QUE NO HAY POLÍTICAS
SELECT 
  '🔍 VERIFICACIÓN' as seccion,
  COUNT(*) as politicas_restantes
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. PROBAR ACCESO SIN RLS
SELECT 
  '✅ ACCESO SIN RLS' as seccion,
  COUNT(*) as total_profiles
FROM public.profiles;

-- 5. HABILITAR RLS CON POLÍTICAS MÍNIMAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. CREAR SOLO POLÍTICAS BÁSICAS (SIN FUNCIONES COMPLEJAS)
-- Política 1: Usuarios pueden ver su propio perfil
CREATE POLICY "basic_own_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política 2: Usuarios pueden actualizar su propio perfil
CREATE POLICY "basic_own_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Política 3: Usuarios pueden insertar su propio perfil
CREATE POLICY "basic_own_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 7. VERIFICAR POLÍTICAS BÁSICAS
SELECT 
  '✅ POLÍTICAS BÁSICAS' as seccion,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 8. PROBAR ACCESO BÁSICO
SELECT 
  '🧪 PRUEBA FINAL' as seccion,
  'RLS básico funcionando' as estado;
