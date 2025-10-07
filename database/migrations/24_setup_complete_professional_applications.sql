-- Migración completa para crear la tabla professional_applications con todos los campos y políticas RLS
-- Esta migración combina las migraciones 20, 21, 22 y 23

-- 1. Crear la tabla professional_applications si no existe
CREATE TABLE IF NOT EXISTS public.professional_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profession VARCHAR(100) NOT NULL,
    specializations TEXT[] NOT NULL DEFAULT '{}',
    experience VARCHAR(50) NOT NULL,
    certifications TEXT[] NOT NULL DEFAULT '{}',
    services JSONB NOT NULL DEFAULT '[]',
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'México',
    biography TEXT,
    profile_photo TEXT,
    gallery TEXT[] NOT NULL DEFAULT '{}',
    wellness_areas TEXT[] NOT NULL DEFAULT '{}',
    working_start_time TIME DEFAULT '09:00',
    working_end_time TIME DEFAULT '18:00',
    working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    
    -- Campos de términos y privacidad (migración 22)
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    privacy_accepted BOOLEAN NOT NULL DEFAULT false,
    
    -- Campos de revisión (migración 23)
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT professional_applications_pkey PRIMARY KEY (id),
    CONSTRAINT professional_applications_email_unique UNIQUE (email)
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_professional_applications_user_id ON public.professional_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_applications_status ON public.professional_applications(status);
CREATE INDEX IF NOT EXISTS idx_professional_applications_profession ON public.professional_applications(profession);
CREATE INDEX IF NOT EXISTS idx_professional_applications_city ON public.professional_applications(city);
CREATE INDEX IF NOT EXISTS idx_professional_applications_wellness_areas ON public.professional_applications USING GIN (wellness_areas);
CREATE INDEX IF NOT EXISTS idx_professional_applications_working_hours ON public.professional_applications (working_start_time, working_end_time);
CREATE INDEX IF NOT EXISTS idx_professional_applications_working_days ON public.professional_applications USING GIN (working_days);
CREATE INDEX IF NOT EXISTS idx_professional_applications_submitted_at ON public.professional_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_professional_applications_reviewed_at ON public.professional_applications(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_professional_applications_reviewed_by ON public.professional_applications(reviewed_by);

-- 3. Crear función para actualizar updated_at automáticamente (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_professional_applications_updated_at ON public.professional_applications;
CREATE TRIGGER update_professional_applications_updated_at 
    BEFORE UPDATE ON public.professional_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar Row Level Security
ALTER TABLE public.professional_applications ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can insert own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can update own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can delete own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Patients can view approved professionals" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can update pending applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.professional_applications;

-- 7. Crear políticas RLS para usuarios regulares
-- Política para que los usuarios solo vean su propia aplicación
CREATE POLICY "Users can view own professional application" ON public.professional_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar su propia aplicación
CREATE POLICY "Users can insert own professional application" ON public.professional_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar su propia aplicación
CREATE POLICY "Users can update own professional application" ON public.professional_applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar su propia aplicación
CREATE POLICY "Users can delete own professional application" ON public.professional_applications
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Política especial para que los pacientes puedan ver aplicaciones aprobadas
CREATE POLICY "Patients can view approved professionals" ON public.professional_applications
    FOR SELECT USING (status = 'approved');

-- 9. Políticas para administradores
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

-- 10. Comentarios para documentar los campos
COMMENT ON TABLE public.professional_applications IS 'Tabla para almacenar las aplicaciones de profesionales de la salud';
COMMENT ON COLUMN public.professional_applications.user_id IS 'ID del usuario que aplicó como profesional';
COMMENT ON COLUMN public.professional_applications.profession IS 'Profesión del profesional (ej: Psicólogo, Nutriólogo, etc.)';
COMMENT ON COLUMN public.professional_applications.specializations IS 'Array de especializaciones del profesional';
COMMENT ON COLUMN public.professional_applications.experience IS 'Años de experiencia del profesional';
COMMENT ON COLUMN public.professional_applications.certifications IS 'Array de certificaciones del profesional';
COMMENT ON COLUMN public.professional_applications.services IS 'JSON con los servicios que ofrece el profesional';
COMMENT ON COLUMN public.professional_applications.gallery IS 'Array de URLs de imágenes de la galería del profesional';
COMMENT ON COLUMN public.professional_applications.wellness_areas IS 'Áreas de bienestar en las que se especializa';
COMMENT ON COLUMN public.professional_applications.working_start_time IS 'Hora de inicio de la jornada laboral del profesional';
COMMENT ON COLUMN public.professional_applications.working_end_time IS 'Hora de fin de la jornada laboral del profesional';
COMMENT ON COLUMN public.professional_applications.working_days IS 'Días de la semana que trabaja el profesional (1=Lunes, 2=Martes, ..., 7=Domingo)';
COMMENT ON COLUMN public.professional_applications.status IS 'Estado de la aplicación: pending, under_review, approved, rejected';
COMMENT ON COLUMN public.professional_applications.terms_accepted IS 'Indica si el usuario aceptó los términos y condiciones';
COMMENT ON COLUMN public.professional_applications.privacy_accepted IS 'Indica si el usuario aceptó la política de privacidad';
COMMENT ON COLUMN public.professional_applications.submitted_at IS 'Fecha y hora en que se envió la solicitud';
COMMENT ON COLUMN public.professional_applications.reviewed_at IS 'Fecha y hora en que se revisó la solicitud';
COMMENT ON COLUMN public.professional_applications.reviewed_by IS 'ID del administrador que revisó la solicitud';
COMMENT ON COLUMN public.professional_applications.review_notes IS 'Notas del administrador sobre la revisión';

