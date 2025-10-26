-- SCRIPT ALTERNATIVO: Mantener RLS deshabilitado temporalmente
-- EJECUTAR SI EL ERROR DE RECURSIÓN PERSISTE

-- 1. ELIMINAR TODAS LAS POLÍTICAS
DROP POLICY IF EXISTS "basic_own_select" ON public.profiles;
DROP POLICY IF EXISTS "basic_own_update" ON public.profiles;
DROP POLICY IF EXISTS "basic_own_insert" ON public.profiles;
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

-- 2. MANTENER RLS DESHABILITADO
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR ESTADO
SELECT 
  '🚨 RLS DESHABILITADO PERMANENTEMENTE' as seccion,
  'Acceso completo sin restricciones' as estado;

-- 4. PROBAR ACCESO COMPLETO
SELECT 
  '✅ ACCESO COMPLETO' as seccion,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_active = true THEN 1 END) as active_profiles,
  COUNT(CASE WHEN type = 'patient' THEN 1 END) as patients,
  COUNT(CASE WHEN type = 'professional' THEN 1 END) as professionals
FROM public.profiles;

-- 5. NOTA IMPORTANTE
SELECT 
  '⚠️ NOTA IMPORTANTE' as seccion,
  'RLS deshabilitado - La aplicación funcionará pero sin restricciones de seguridad' as advertencia;
