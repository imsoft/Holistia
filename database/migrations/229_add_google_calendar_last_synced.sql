-- Agrega campo para registrar la última sincronización exitosa con Google Calendar
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_calendar_last_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.google_calendar_last_synced_at IS
  'Timestamp de la última sincronización exitosa con Google Calendar (cualquier dirección)';
