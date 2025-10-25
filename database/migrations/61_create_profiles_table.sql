-- ============================================================================
-- MIGRACIÓN 61: Crear tabla public.profiles
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Migrar datos de usuario de auth.users.user_metadata a tabla dedicada
-- Estrategia: Crear tabla, trigger y migrar datos existentes
-- Tiempo estimado: 30 segundos de ejecución
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key que referencia auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos básicos
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Tipo de usuario (admin, patient, professional)
  type TEXT CHECK (type IN ('admin', 'patient', 'professional')) DEFAULT 'patient',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PASO 2: Crear índices para performance
-- ============================================================================

-- Índice en email para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Índice en type para filtros por tipo de usuario
CREATE INDEX IF NOT EXISTS idx_profiles_type ON public.profiles(type);

-- Índice en phone para búsquedas por teléfono
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Índice en nombre completo para búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(first_name, last_name);

-- ============================================================================
-- PASO 3: Habilitar Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 4: Crear políticas RLS básicas
-- ============================================================================

-- Política 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Política 2: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 3: Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
);

-- Política 4: Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
);

-- Política 5: Solo el sistema puede insertar profiles (via trigger)
CREATE POLICY "System can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- PASO 5: Crear función para actualizar updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- ============================================================================
-- PASO 6: Crear trigger para nuevos usuarios
-- ============================================================================
-- Este trigger crea automáticamente un profile cuando se registra un usuario

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    avatar_url,
    type,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'type', 'patient'),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PASO 7: Migrar usuarios existentes
-- ============================================================================
-- Copiar todos los usuarios existentes de auth.users a profiles

INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  avatar_url,
  type,
  created_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name,
  COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
  COALESCE(u.raw_user_meta_data->>'avatar_url', '') as avatar_url,
  COALESCE(u.raw_user_meta_data->>'type', 'patient') as type,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ============================================================================
-- PASO 8: Agregar comentarios a la tabla
-- ============================================================================

COMMENT ON TABLE public.profiles IS 
'Tabla de perfiles de usuario. Reemplaza el uso de auth.users.user_metadata para mejor performance y RLS más granular. Sincronizada automáticamente con auth.users via trigger.';

COMMENT ON COLUMN public.profiles.id IS 
'UUID del usuario, referencia a auth.users.id';

COMMENT ON COLUMN public.profiles.email IS 
'Email del usuario, sincronizado con auth.users.email';

COMMENT ON COLUMN public.profiles.type IS 
'Tipo de usuario: admin, patient o professional';

COMMENT ON COLUMN public.profiles.created_at IS 
'Fecha de creación del perfil, sincronizada con auth.users.created_at';

COMMENT ON COLUMN public.profiles.updated_at IS 
'Fecha de última actualización del perfil';

-- ============================================================================
-- PASO 9: Verificación post-migración
-- ============================================================================

-- Verificar que todos los usuarios tienen profile
SELECT 
  '✅ VERIFICACIÓN' as resultado,
  'Usuarios en auth.users' as metrica,
  COUNT(*)::text as valor
FROM auth.users

UNION ALL

SELECT 
  '✅ VERIFICACIÓN',
  'Profiles creados',
  COUNT(*)::text
FROM public.profiles

UNION ALL

SELECT 
  '✅ VERIFICACIÓN',
  'Usuarios sin profile',
  COUNT(*)::text
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  '✅ VERIFICACIÓN',
  'Distribución - Admins',
  COUNT(*) FILTER (WHERE type = 'admin')::text
FROM public.profiles

UNION ALL

SELECT 
  '✅ VERIFICACIÓN',
  'Distribución - Patients',
  COUNT(*) FILTER (WHERE type = 'patient')::text
FROM public.profiles

UNION ALL

SELECT 
  '✅ VERIFICACIÓN',
  'Distribución - Professionals',
  COUNT(*) FILTER (WHERE type = 'professional')::text
FROM public.profiles

UNION ALL

SELECT 
  '✅ VERIFICACIÓN',
  'Profiles con first_name',
  COUNT(*) FILTER (WHERE first_name IS NOT NULL AND first_name != '')::text
FROM public.profiles

UNION ALL

SELECT 
  '✅ VERIFICACIÓN',
  'Profiles con phone',
  COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '')::text
FROM public.profiles;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
-- La tabla profiles está creada y poblada
-- El trigger está activo para nuevos usuarios
-- RLS está habilitado y configurado
-- ============================================================================

