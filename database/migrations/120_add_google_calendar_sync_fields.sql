-- Migration: Add Google Calendar sync fields to profiles and availability_blocks
-- Descripción: Agrega campos para almacenar información de sincronización con Google Calendar
-- y permite marcar eventos externos de Google Calendar como bloques de disponibilidad

-- 1. Agregar campos a la tabla profiles para almacenar información de suscripción a notificaciones de Google Calendar
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_calendar_channel_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_resource_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_sync_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_webhook_expiration TIMESTAMPTZ;

-- 2. Agregar campo a availability_blocks para marcar eventos que vienen de Google Calendar
ALTER TABLE availability_blocks
ADD COLUMN IF NOT EXISTS is_external_event BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS external_event_source TEXT,
ADD COLUMN IF NOT EXISTS external_event_metadata JSONB;

-- 3. Crear índice para búsqueda rápida de eventos externos
CREATE INDEX IF NOT EXISTS idx_availability_blocks_external_events
ON availability_blocks(professional_id, is_external_event)
WHERE is_external_event = TRUE;

-- 4. Crear índice para búsqueda por google_calendar_event_id
CREATE INDEX IF NOT EXISTS idx_availability_blocks_google_event_id
ON availability_blocks(google_calendar_event_id)
WHERE google_calendar_event_id IS NOT NULL;

-- Comentarios sobre el uso:
-- - google_calendar_channel_id: ID único del canal de notificaciones de Google Calendar
-- - google_calendar_resource_id: ID del recurso que se está observando
-- - google_calendar_sync_token: Token para sincronización incremental
-- - google_calendar_webhook_expiration: Fecha de expiración del webhook (máximo 7 días)
-- - is_external_event: TRUE si el bloqueo viene de un evento externo de Google Calendar
-- - external_event_source: Fuente del evento externo (ej: 'google_calendar')
-- - external_event_metadata: Metadata adicional del evento externo (JSON)
