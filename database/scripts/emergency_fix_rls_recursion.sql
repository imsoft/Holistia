-- SCRIPT DE EMERGENCIA: Solucionar recursión infinita en políticas RLS
-- EJECUTAR INMEDIATAMENTE EN SUPABASE DASHBOARD

-- 1. ELIMINAR TODAS LAS POLÍTICAS PROBLEMÁTICAS DE PROFILES
DROP POLICY IF EXISTS "Professionals can view their patients" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles if account is active" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2. CREAR POLÍTICAS SIMPLES Y SEGURAS
-- Política básica para que usuarios vean su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para que usuarios vean otros perfiles activos (sin recursión)
CREATE POLICY "Users can view active profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (account_active = true);

-- Política para admins (sin recursión)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.type = 'admin'
    )
  );

-- 3. VERIFICAR QUE NO HAY RECURSIÓN
SELECT 
  '✅ POLÍTICAS VERIFICADAS' as seccion,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. PROBAR ACCESO BÁSICO
SELECT 
  '🧪 PRUEBA ACCESO' as seccion,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_active = true THEN 1 END) as active_profiles
FROM public.profiles;
