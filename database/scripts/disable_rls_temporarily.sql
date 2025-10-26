-- SCRIPT DE EMERGENCIA: Deshabilitar RLS temporalmente
-- EJECUTAR INMEDIATAMENTE EN SUPABASE DASHBOARD

-- 1. ELIMINAR TODAS LAS POLÍTICAS
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
DROP POLICY IF EXISTS "profile_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_insert" ON public.profiles;
DROP POLICY IF EXISTS "profile_active_select" ON public.profiles;

-- 2. DESHABILITAR RLS COMPLETAMENTE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR ESTADO
SELECT 
  '🚨 RLS DESHABILITADO' as seccion,
  'Acceso completo restaurado temporalmente' as estado;

-- 4. PROBAR ACCESO
SELECT 
  '✅ PRUEBA ACCESO' as seccion,
  COUNT(*) as total_profiles
FROM public.profiles;
