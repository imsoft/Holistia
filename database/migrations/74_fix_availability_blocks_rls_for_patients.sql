-- Migración: Corregir políticas RLS para availability_blocks
-- Propósito: Permitir que los pacientes vean los bloqueos de disponibilidad de los profesionales

-- 1. Eliminar políticas existentes que bloquean el acceso de pacientes
DROP POLICY IF EXISTS "Users can view own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can insert own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can update own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can delete own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Professionals can manage their own availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Patients can view availability blocks" ON public.availability_blocks;

-- 2. Crear nuevas políticas RLS

-- Política para que los profesionales puedan gestionar sus propios bloqueos
CREATE POLICY "Professionals can manage their own availability blocks"
ON public.availability_blocks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.professional_applications 
    WHERE professional_applications.id = availability_blocks.professional_id 
    AND professional_applications.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professional_applications 
    WHERE professional_applications.id = availability_blocks.professional_id 
    AND professional_applications.user_id = auth.uid()
  )
);

-- Política para que los pacientes puedan ver los bloqueos de disponibilidad de los profesionales
-- Esto es necesario para que puedan ver qué horarios están bloqueados al reservar citas
CREATE POLICY "Patients can view professional availability blocks"
ON public.availability_blocks
FOR SELECT
USING (
  -- Permitir acceso si el usuario es un paciente (no es admin ni profesional)
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type IN ('admin', 'professional')
  )
  OR
  -- Permitir acceso si el usuario es admin
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- Política para administradores (ya existe pero la recreamos para asegurar consistencia)
DROP POLICY IF EXISTS "Admins can view all availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Admins can manage all availability blocks" ON public.availability_blocks;

CREATE POLICY "Admins can view all availability blocks" 
ON public.availability_blocks
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can manage all availability blocks" 
ON public.availability_blocks
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- 3. Verificar que se crearon las políticas
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN policyname LIKE '%Admin%' THEN '✅ Admin'
    WHEN policyname LIKE '%Professional%' THEN '👨‍⚕️ Professional'
    WHEN policyname LIKE '%Patient%' THEN '👤 Patient'
    ELSE '👥 Other'
  END as tipo
FROM pg_policies 
WHERE tablename = 'availability_blocks'
ORDER BY policyname;

-- Comentarios sobre las políticas
COMMENT ON POLICY "Professionals can manage their own availability blocks" ON public.availability_blocks 
  IS 'Permite a los profesionales gestionar sus propios bloqueos de disponibilidad';
COMMENT ON POLICY "Patients can view professional availability blocks" ON public.availability_blocks 
  IS 'Permite a los pacientes ver los bloqueos de disponibilidad de los profesionales para reservar citas';
COMMENT ON POLICY "Admins can view all availability blocks" ON public.availability_blocks 
  IS 'Permite a los administradores ver todos los bloqueos de disponibilidad';
COMMENT ON POLICY "Admins can manage all availability blocks" ON public.availability_blocks 
  IS 'Permite a los administradores gestionar todos los bloqueos de disponibilidad';
