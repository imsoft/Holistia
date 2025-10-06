-- Recrear la tabla professional_applications con todos los campos necesarios
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT professional_applications_pkey PRIMARY KEY (id),
    CONSTRAINT professional_applications_email_unique UNIQUE (email)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_professional_applications_user_id ON professional_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_applications_status ON professional_applications(status);
CREATE INDEX IF NOT EXISTS idx_professional_applications_profession ON professional_applications(profession);
CREATE INDEX IF NOT EXISTS idx_professional_applications_city ON professional_applications(city);
CREATE INDEX IF NOT EXISTS idx_professional_applications_wellness_areas ON professional_applications USING GIN (wellness_areas);
CREATE INDEX IF NOT EXISTS idx_professional_applications_working_hours ON professional_applications (working_start_time, working_end_time);
CREATE INDEX IF NOT EXISTS idx_professional_applications_working_days ON professional_applications USING GIN (working_days);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_professional_applications_updated_at 
    BEFORE UPDATE ON professional_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar los campos
COMMENT ON TABLE professional_applications IS 'Tabla para almacenar las aplicaciones de profesionales de la salud';
COMMENT ON COLUMN professional_applications.user_id IS 'ID del usuario que aplicó como profesional';
COMMENT ON COLUMN professional_applications.profession IS 'Profesión del profesional (ej: Psicólogo, Nutriólogo, etc.)';
COMMENT ON COLUMN professional_applications.specializations IS 'Array de especializaciones del profesional';
COMMENT ON COLUMN professional_applications.experience IS 'Años de experiencia del profesional';
COMMENT ON COLUMN professional_applications.certifications IS 'Array de certificaciones del profesional';
COMMENT ON COLUMN professional_applications.services IS 'JSON con los servicios que ofrece el profesional';
COMMENT ON COLUMN professional_applications.gallery IS 'Array de URLs de imágenes de la galería del profesional';
COMMENT ON COLUMN professional_applications.wellness_areas IS 'Áreas de bienestar en las que se especializa';
COMMENT ON COLUMN professional_applications.working_start_time IS 'Hora de inicio de la jornada laboral del profesional';
COMMENT ON COLUMN professional_applications.working_end_time IS 'Hora de fin de la jornada laboral del profesional';
COMMENT ON COLUMN professional_applications.working_days IS 'Días de la semana que trabaja el profesional (1=Lunes, 2=Martes, ..., 7=Domingo)';
COMMENT ON COLUMN professional_applications.status IS 'Estado de la aplicación: pending, under_review, approved, rejected';
