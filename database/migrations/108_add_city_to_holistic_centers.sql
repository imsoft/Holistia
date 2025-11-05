-- =====================================================
-- MIGRACIÓN: Agregar campo ciudad a centros holísticos
-- =====================================================
-- Agrega el campo 'city' para separar la ciudad de la dirección
-- =====================================================

-- Agregar columna city a la tabla holistic_centers
ALTER TABLE public.holistic_centers
ADD COLUMN IF NOT EXISTS city TEXT;

-- Agregar índice para búsquedas por ciudad
CREATE INDEX IF NOT EXISTS idx_holistic_centers_city
ON public.holistic_centers(city);

-- Agregar comentario para documentación
COMMENT ON COLUMN public.holistic_centers.city IS 'Ciudad donde se encuentra el centro holístico';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
