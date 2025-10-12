-- Migración para agregar campo de posición de imagen a professional_applications
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Agregar columna para la posición de la imagen en las cards
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS image_position VARCHAR(50) DEFAULT 'center center';

-- Comentario para documentar el campo
COMMENT ON COLUMN public.professional_applications.image_position IS 'Posición de la imagen en la card del profesional (ej: center center, top left, etc.)';

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_professional_applications_image_position 
ON public.professional_applications(image_position);

-- Actualizar registros existentes con posición por defecto
UPDATE public.professional_applications 
SET image_position = 'center center' 
WHERE image_position IS NULL;
