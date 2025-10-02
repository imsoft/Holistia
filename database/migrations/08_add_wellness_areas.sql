-- Agregar campo wellness_areas a la tabla professional_applications
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Agregar la columna wellness_areas como array de texto
ALTER TABLE professional_applications 
ADD COLUMN IF NOT EXISTS wellness_areas TEXT[] DEFAULT '{}';

-- Crear índice para mejorar el rendimiento en consultas por áreas de bienestar
CREATE INDEX IF NOT EXISTS idx_professional_applications_wellness_areas 
ON professional_applications USING GIN (wellness_areas);

-- Comentario para documentar el campo
COMMENT ON COLUMN professional_applications.wellness_areas IS 'Áreas de bienestar en las que el profesional puede ayudar: Salud mental, Espiritualidad, Actividad física, Social, Alimentación';
