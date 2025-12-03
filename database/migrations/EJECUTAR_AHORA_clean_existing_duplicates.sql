-- ⚠️ EJECUTAR ESTE SCRIPT AHORA EN SUPABASE SQL EDITOR
-- Este script limpia los duplicados que ya existen en la base de datos
-- El constraint único ya existe, pero no elimina duplicados existentes

-- Paso 1: Ver cuántos duplicados hay antes de limpiar
SELECT
  'ANTES DE LIMPIAR' as momento,
  COUNT(*) as total_bloques,
  COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as bloques_unicos,
  COUNT(*) - COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as duplicados_a_eliminar
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- Paso 2: Eliminar duplicados manteniendo solo el más antiguo (rn = 1)
WITH duplicates AS (
  SELECT
    id,
    google_calendar_event_id,
    start_date,
    start_time,
    end_time,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY
        google_calendar_event_id,
        start_date,
        COALESCE(start_time::text, 'full_day'),
        COALESCE(end_time::text, 'full_day')
      ORDER BY created_at ASC  -- El más antiguo primero (rn = 1)
    ) as rn
  FROM availability_blocks
  WHERE is_external_event = true
    AND google_calendar_event_id IS NOT NULL
)
DELETE FROM availability_blocks
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1  -- Eliminar todos excepto el más antiguo
);

-- Paso 3: Verificar que ya no hay duplicados
SELECT
  'DESPUES DE LIMPIAR' as momento,
  COUNT(*) as total_bloques,
  COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as bloques_unicos,
  COUNT(*) - COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as duplicados_restantes
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- Paso 4: Debe mostrar 0 filas (sin duplicados)
SELECT
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day') as start_time,
  COALESCE(end_time::text, 'full_day') as end_time,
  COUNT(*) as count
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL
GROUP BY
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day'),
  COALESCE(end_time::text, 'full_day')
HAVING COUNT(*) > 1;
