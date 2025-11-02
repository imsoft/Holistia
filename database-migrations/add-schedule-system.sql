-- =====================================================
-- MIGRACIÓN: Sistema de horarios personalizados
-- =====================================================
-- Este script actualiza las tablas holistic_centers y restaurants
-- para soportar horarios personalizados en formato JSON
-- =====================================================

-- 1. Actualizar tabla holistic_centers
-- Cambiar opening_hours de text a jsonb
ALTER TABLE public.holistic_centers
ALTER COLUMN opening_hours TYPE jsonb USING
  CASE
    WHEN opening_hours IS NULL THEN NULL
    WHEN opening_hours::text = '' THEN NULL
    ELSE ('[]'::jsonb)
  END;

-- Agregar comentario para documentar la estructura
COMMENT ON COLUMN public.holistic_centers.opening_hours IS
'Horarios de atención en formato JSON. Estructura:
[
  {
    "day": "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
    "enabled": boolean,
    "hours": [
      {"open": "HH:MM", "close": "HH:MM"}
    ]
  }
]';

-- 2. Actualizar tabla restaurants
-- Cambiar opening_hours de text a jsonb
ALTER TABLE public.restaurants
ALTER COLUMN opening_hours TYPE jsonb USING
  CASE
    WHEN opening_hours IS NULL THEN NULL
    WHEN opening_hours::text = '' THEN NULL
    ELSE ('[]'::jsonb)
  END;

-- Agregar comentario para documentar la estructura
COMMENT ON COLUMN public.restaurants.opening_hours IS
'Horarios de atención en formato JSON. Estructura:
[
  {
    "day": "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
    "enabled": boolean,
    "hours": [
      {"open": "HH:MM", "close": "HH:MM"}
    ]
  }
]';

-- 3. Crear índices GIN para búsquedas eficientes en JSON
CREATE INDEX IF NOT EXISTS idx_holistic_centers_opening_hours
ON public.holistic_centers USING gin (opening_hours);

CREATE INDEX IF NOT EXISTS idx_restaurants_opening_hours
ON public.restaurants USING gin (opening_hours);

-- 4. Función helper para validar estructura de horarios
CREATE OR REPLACE FUNCTION validate_schedule(schedule jsonb)
RETURNS boolean AS $$
BEGIN
  -- Verificar que sea un array
  IF jsonb_typeof(schedule) != 'array' THEN
    RETURN FALSE;
  END IF;

  -- Verificar estructura de cada día
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(schedule) AS day
    WHERE NOT (
      day ? 'day' AND
      day ? 'enabled' AND
      day ? 'hours' AND
      jsonb_typeof(day->'hours') = 'array'
    )
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Agregar constraint para validar formato
ALTER TABLE public.holistic_centers
ADD CONSTRAINT check_opening_hours_format
CHECK (opening_hours IS NULL OR validate_schedule(opening_hours));

ALTER TABLE public.restaurants
ADD CONSTRAINT check_opening_hours_format
CHECK (opening_hours IS NULL OR validate_schedule(opening_hours));

-- =====================================================
-- EJEMPLO DE USO:
-- =====================================================
-- UPDATE holistic_centers
-- SET opening_hours = '[
--   {
--     "day": "monday",
--     "enabled": true,
--     "hours": [
--       {"open": "09:00", "close": "13:00"},
--       {"open": "15:00", "close": "19:00"}
--     ]
--   },
--   {
--     "day": "tuesday",
--     "enabled": true,
--     "hours": [
--       {"open": "09:00", "close": "18:00"}
--     ]
--   },
--   {
--     "day": "wednesday",
--     "enabled": false,
--     "hours": []
--   }
-- ]'::jsonb
-- WHERE id = 'your-center-id';
-- =====================================================
