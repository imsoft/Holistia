-- Migration: Fix unique constraint to include calendar_source_id
-- Descripción: Actualiza el constraint único para incluir calendar_source_id,
--              permitiendo que el mismo evento de Google Calendar pueda existir
--              como bloque si viene de diferentes calendarios.
--
-- Problema: El constraint actual causa errores de clave duplicada cuando
--           un profesional sincroniza múltiples calendarios con el mismo evento.

-- 1. Eliminar el constraint antiguo
DROP INDEX IF EXISTS idx_availability_blocks_unique_external_event;

-- 2. Crear nuevo constraint que incluye calendar_source_id
CREATE UNIQUE INDEX idx_availability_blocks_unique_external_event
ON availability_blocks (
  COALESCE(calendar_source_id, 'primary'),
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day'),
  COALESCE(end_time::text, 'full_day')
)
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- Comentario actualizado
COMMENT ON INDEX idx_availability_blocks_unique_external_event IS
'Unique constraint to prevent duplicate external events from Google Calendar.
Combines calendar_source_id + event_id + date + time to allow:
- Recurring events (same event_id but different dates)
- Same event in different calendars (same event_id but different calendar_source_id)';

-- 3. Actualizar bloques existentes sin calendar_source_id
-- Marcarlos como 'primary' para que sean compatibles con el nuevo constraint
UPDATE availability_blocks
SET calendar_source_id = 'primary'
WHERE is_external_event = true
  AND external_event_source = 'google_calendar'
  AND calendar_source_id IS NULL;
