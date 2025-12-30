-- ============================================================================
-- MIGRACIÓN 148: Agregar categorías de bienestar a retos, comercios y restaurantes
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Agregar campo wellness_areas a challenges, shops y restaurants
--             para que puedan categorizarse con las 5 áreas de bienestar:
--             Salud mental, Espiritualidad, Actividad física, Social, Alimentación
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR WELLNESS_AREAS A CHALLENGES (RETOS)
-- ============================================================================

-- Agregar columna wellness_areas como array de texto
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS wellness_areas TEXT[] DEFAULT '{}';

-- Crear índice para mejorar el rendimiento en consultas por áreas de bienestar
CREATE INDEX IF NOT EXISTS idx_challenges_wellness_areas 
ON public.challenges USING GIN (wellness_areas);

-- Comentario para documentar el campo
COMMENT ON COLUMN public.challenges.wellness_areas IS 
'Áreas de bienestar del reto: Salud mental, Espiritualidad, Actividad física, Social, Alimentación. Puede tener múltiples áreas.';

-- ============================================================================
-- 2. AGREGAR WELLNESS_AREAS A SHOPS (COMERCIOS)
-- ============================================================================

-- Agregar columna wellness_areas como array de texto
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS wellness_areas TEXT[] DEFAULT '{}';

-- Crear índice para mejorar el rendimiento en consultas por áreas de bienestar
CREATE INDEX IF NOT EXISTS idx_shops_wellness_areas 
ON public.shops USING GIN (wellness_areas);

-- Comentario para documentar el campo
COMMENT ON COLUMN public.shops.wellness_areas IS 
'Áreas de bienestar del comercio: Salud mental, Espiritualidad, Actividad física, Social, Alimentación. Puede tener múltiples áreas.';

-- ============================================================================
-- 3. AGREGAR WELLNESS_AREAS A RESTAURANTS (RESTAURANTES)
-- ============================================================================

-- Agregar columna wellness_areas como array de texto
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS wellness_areas TEXT[] DEFAULT '{}';

-- Crear índice para mejorar el rendimiento en consultas por áreas de bienestar
CREATE INDEX IF NOT EXISTS idx_restaurants_wellness_areas 
ON public.restaurants USING GIN (wellness_areas);

-- Comentario para documentar el campo
COMMENT ON COLUMN public.restaurants.wellness_areas IS 
'Áreas de bienestar del restaurante: Salud mental, Espiritualidad, Actividad física, Social, Alimentación. Puede tener múltiples áreas.';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Los valores válidos para wellness_areas son:
-- - 'Salud mental'
-- - 'Espiritualidad'
-- - 'Actividad física'
-- - 'Social'
-- - 'Alimentación'
--
-- Estos valores deben ser asignados desde la interfaz de administración
-- o desde los formularios de creación/edición correspondientes.
