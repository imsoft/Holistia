-- Migración: Agregar campos de revisión a professional_applications
-- Propósito: Agregar campos necesarios para el proceso de revisión y aprobación de solicitudes

-- 1. Agregar campo submitted_at (opcional si quieres diferenciarlo de created_at)
-- Por ahora usaremos created_at como submitted_at, pero agregamos el campo por compatibilidad
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Copiar valores de created_at a submitted_at para registros existentes
UPDATE public.professional_applications
SET submitted_at = created_at
WHERE submitted_at IS NULL;

-- Hacer que submitted_at tenga un valor por defecto
ALTER TABLE public.professional_applications
ALTER COLUMN submitted_at SET DEFAULT NOW();

-- 2. Agregar campo reviewed_at
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- 3. Agregar campo reviewed_by (referencia al admin que revisó)
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- 4. Agregar campo review_notes (notas de la revisión)
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 5. Crear índice para reviewed_at para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_professional_applications_reviewed_at 
ON public.professional_applications(reviewed_at);

-- 6. Crear índice para reviewed_by
CREATE INDEX IF NOT EXISTS idx_professional_applications_reviewed_by 
ON public.professional_applications(reviewed_by);

-- 7. Crear índice para submitted_at
CREATE INDEX IF NOT EXISTS idx_professional_applications_submitted_at 
ON public.professional_applications(submitted_at);

-- 8. Eliminar políticas existentes para recrearlas (si existen)
DROP POLICY IF EXISTS "Admins can view all applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.professional_applications;

-- 9. Crear políticas RLS para administradores
-- Política para que los administradores puedan ver todas las solicitudes
CREATE POLICY "Admins can view all applications" ON public.professional_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- Política para que los administradores puedan actualizar todas las solicitudes
CREATE POLICY "Admins can update all applications" ON public.professional_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- Comentarios sobre los nuevos campos
COMMENT ON COLUMN public.professional_applications.submitted_at IS 'Fecha y hora en que se envió la solicitud';
COMMENT ON COLUMN public.professional_applications.reviewed_at IS 'Fecha y hora en que se revisó la solicitud';
COMMENT ON COLUMN public.professional_applications.reviewed_by IS 'ID del administrador que revisó la solicitud';
COMMENT ON COLUMN public.professional_applications.review_notes IS 'Notas del administrador sobre la revisión';

