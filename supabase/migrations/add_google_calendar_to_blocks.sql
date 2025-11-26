-- Agregar campo google_calendar_event_id a availability_blocks
-- Para sincronizar bloqueos con Google Calendar del profesional

ALTER TABLE availability_blocks
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Agregar índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_availability_blocks_google_event
ON availability_blocks(google_calendar_event_id)
WHERE google_calendar_event_id IS NOT NULL;

-- Comentario explicativo
COMMENT ON COLUMN availability_blocks.google_calendar_event_id IS
'ID del evento en Google Calendar asociado a este bloqueo de disponibilidad';
