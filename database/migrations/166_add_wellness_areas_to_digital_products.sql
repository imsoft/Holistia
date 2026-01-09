-- ============================================================================
-- MIGRACIÓN 166: Agregar categorías de bienestar a productos digitales
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Agregar campo wellness_areas a digital_products
--             para que puedan categorizarse con las 5 áreas de bienestar:
--             Salud mental, Espiritualidad, Actividad física, Social, Alimentación
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR WELLNESS_AREAS A DIGITAL_PRODUCTS
-- ============================================================================

-- Agregar columna wellness_areas como array de texto
ALTER TABLE public.digital_products
ADD COLUMN IF NOT EXISTS wellness_areas TEXT[] DEFAULT '{}';

-- Crear índice para mejorar el rendimiento en consultas por áreas de bienestar
CREATE INDEX IF NOT EXISTS idx_digital_products_wellness_areas 
ON public.digital_products USING GIN (wellness_areas);

-- Comentario para documentar el campo
COMMENT ON COLUMN public.digital_products.wellness_areas IS 
'Áreas de bienestar del programa: Salud mental, Espiritualidad, Actividad física, Social, Alimentación. Puede tener múltiples áreas. Si está vacío, se usará el wellness_areas del profesional asociado para filtrado.';

-- ============================================================================
-- 2. ACTUALIZAR PROGRAMAS EXISTENTES (OPCIONAL)
-- ============================================================================
-- Los programas existentes tendrán un array vacío por defecto
-- El filtrado seguirá funcionando usando wellness_areas del profesional
-- hasta que se actualicen manualmente

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
-- Si wellness_areas está vacío, el filtrado usará el wellness_areas
-- del profesional asociado como fallback.
--
-- Estos valores deben ser asignados desde el formulario de creación/edición
-- de productos digitales.
