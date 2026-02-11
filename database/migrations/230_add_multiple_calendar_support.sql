-- ============================================================================
-- MIGRACIÓN: Soporte para Múltiples Calendarios de Google Calendar
-- ============================================================================
-- Permite a los usuarios sincronizar eventos de varios calendarios de Google
-- en lugar de solo el calendario principal ('primary')
-- ============================================================================

-- 1. Agregar campo para almacenar calendarios seleccionados
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_calendars_selected JSONB DEFAULT '[{"id": "primary", "summary": "Primary", "backgroundColor": null}]'::jsonb;

-- 2. Agregar campo para identificar de qué calendario viene cada bloque
ALTER TABLE availability_blocks
ADD COLUMN IF NOT EXISTS calendar_source_id TEXT;

-- 3. Comentarios para documentación
COMMENT ON COLUMN profiles.google_calendars_selected IS
  'Array de calendarios de Google seleccionados para sincronización. Formato: [{"id": "primary", "summary": "Nombre", "backgroundColor": "#color"}]';

COMMENT ON COLUMN availability_blocks.calendar_source_id IS
  'ID del calendario de Google del que proviene este bloque (ej: "primary", "email@gmail.com")';

-- 4. Crear índice para búsquedas por calendario
CREATE INDEX IF NOT EXISTS idx_availability_blocks_calendar_source
ON availability_blocks(calendar_source_id)
WHERE calendar_source_id IS NOT NULL;

-- 5. Migrar datos existentes: marcar bloques de Google Calendar existentes con 'primary'
UPDATE availability_blocks
SET calendar_source_id = 'primary'
WHERE is_external_event = TRUE
  AND external_event_source = 'google_calendar'
  AND calendar_source_id IS NULL;
