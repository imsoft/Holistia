-- =====================================================
-- MIGRACIÓN: Agregar campo Instagram
-- =====================================================
-- Agrega el campo instagram a las tablas holistic_centers
-- y restaurants
-- =====================================================

-- 1. Agregar campo instagram a holistic_centers
ALTER TABLE public.holistic_centers
ADD COLUMN IF NOT EXISTS instagram text;

-- Agregar comentario
COMMENT ON COLUMN public.holistic_centers.instagram IS
'Nombre de usuario de Instagram del centro holístico (con o sin @)';

-- 2. Agregar campo instagram a restaurants
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS instagram text;

-- Agregar comentario
COMMENT ON COLUMN public.restaurants.instagram IS
'Nombre de usuario de Instagram del restaurante (con o sin @)';

-- 3. Crear índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_holistic_centers_instagram
ON public.holistic_centers (instagram)
WHERE instagram IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_instagram
ON public.restaurants (instagram)
WHERE instagram IS NOT NULL;

-- =====================================================
-- EJEMPLO DE USO:
-- =====================================================
-- UPDATE holistic_centers
-- SET instagram = '@mi_centro_holistico'
-- WHERE id = 'your-center-id';
--
-- UPDATE restaurants
-- SET instagram = '@mi_restaurante'
-- WHERE id = 'your-restaurant-id';
-- =====================================================
