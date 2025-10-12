-- Migración para agregar campo de posición de imagen a events_workshops
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Agregar columna para la posición de la imagen en las cards
ALTER TABLE public.events_workshops
ADD COLUMN IF NOT EXISTS image_position VARCHAR(50) DEFAULT 'center center';

-- Comentario para documentar el campo
COMMENT ON COLUMN public.events_workshops.image_position IS 'Posición de la imagen principal en la card del evento (ej: center center, top left, etc.)';

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_events_workshops_image_position 
ON public.events_workshops(image_position);

-- Actualizar registros existentes con posición por defecto
UPDATE public.events_workshops 
SET image_position = 'center center' 
WHERE image_position IS NULL;
