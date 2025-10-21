-- Agregar campo de idiomas a professional_applications
-- Los idiomas se almacenarán como un array de strings en formato de oración
-- Ejemplo: ["Español", "Inglés", "Francés"]

ALTER TABLE professional_applications
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['Español']::TEXT[];

-- Crear índice para búsquedas eficientes por idioma
CREATE INDEX IF NOT EXISTS idx_professional_applications_languages
ON professional_applications USING GIN (languages);

-- Comentario descriptivo
COMMENT ON COLUMN professional_applications.languages IS 'Idiomas que habla el profesional, almacenados en formato de oración (Primera letra mayúscula)';
