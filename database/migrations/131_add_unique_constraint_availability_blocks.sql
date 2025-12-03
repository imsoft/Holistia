-- Migration: Add unique constraint to prevent duplicate blocks
-- Descripción: Previene que se creen bloques duplicados con el mismo event_id + fecha + hora

-- Primero, eliminar duplicados existentes manteniendo solo el más antiguo de cada grupo
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        google_calendar_event_id,
        start_date,
        COALESCE(start_time::text, 'full_day'),
        COALESCE(end_time::text, 'full_day')
      ORDER BY created_at ASC
    ) as rn
  FROM availability_blocks
  WHERE is_external_event = true
    AND google_calendar_event_id IS NOT NULL
)
DELETE FROM availability_blocks
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Crear índice único parcial para eventos externos
-- Esto previene duplicados solo para bloques externos con google_calendar_event_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_blocks_unique_external_event
ON availability_blocks (
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day'),
  COALESCE(end_time::text, 'full_day')
)
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- Comentario sobre el constraint
COMMENT ON INDEX idx_availability_blocks_unique_external_event IS
'Unique constraint to prevent duplicate external events from Google Calendar.
Combines event_id + date + time to allow recurring events (same event_id but different dates).';
