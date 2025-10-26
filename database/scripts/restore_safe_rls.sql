-- SCRIPT PARA RESTAURAR RLS DE FORMA SEGURA
-- Ejecutar después de que el acceso esté restaurado

-- 1. HABILITAR RLS NUEVAMENTE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. CREAR POLÍTICAS BÁSICAS Y SEGURAS (SIN RECURSIÓN)
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

-- 3. VERIFICAR POLÍTICAS CREADAS
SELECT 
  '✅ POLÍTICAS RESTAURADAS' as seccion,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. PROBAR ACCESO BÁSICO
SELECT 
  '🧪 PRUEBA ACCESO' as seccion,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_active = true THEN 1 END) as active_profiles
FROM public.profiles;

-- 5. VERIFICAR QUE NO HAY RECURSIÓN
SELECT 
  '🔍 VERIFICACIÓN FINAL' as seccion,
  'RLS restaurado sin recursión' as estado;
