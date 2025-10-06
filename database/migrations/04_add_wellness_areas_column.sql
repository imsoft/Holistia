-- Agregar columna wellness_areas a la tabla professional_applications
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Agregar la columna wellness_areas
ALTER TABLE professional_applications 
ADD COLUMN IF NOT EXISTS wellness_areas TEXT[] NOT NULL DEFAULT '{}';

-- Crear un índice para mejorar las consultas de filtrado por wellness_areas
CREATE INDEX IF NOT EXISTS idx_professional_applications_wellness_areas 
ON professional_applications USING GIN (wellness_areas);

-- Comentario para documentar la columna
COMMENT ON COLUMN professional_applications.wellness_areas IS 'Áreas de bienestar en las que se especializa el profesional (ej: Salud mental, Espiritualidad, Actividad física, Social, Alimentación)';
