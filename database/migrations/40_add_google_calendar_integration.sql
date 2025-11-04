-- Migración para integrar Google Calendar
-- Esta migración agrega las columnas necesarias para almacenar tokens de Google Calendar

-- 1. Agregar columnas a la tabla profiles para almacenar tokens de Google Calendar
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT DEFAULT 'primary';

-- 2. Crear índice para búsquedas rápidas de usuarios conectados
CREATE INDEX IF NOT EXISTS idx_profiles_google_calendar_connected
ON profiles(google_calendar_connected)
WHERE google_calendar_connected = TRUE;

-- 3. Agregar columna a appointments para vincular con eventos de Google Calendar
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- 4. Crear índice para búsquedas rápidas de eventos sincronizados
CREATE INDEX IF NOT EXISTS idx_appointments_google_event
ON appointments(google_calendar_event_id)
WHERE google_calendar_event_id IS NOT NULL;

-- 5. Agregar columna a events_workshops para vincular con eventos de Google Calendar
ALTER TABLE events_workshops
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- 6. Crear índice para búsquedas rápidas de talleres sincronizados
CREATE INDEX IF NOT EXISTS idx_events_workshops_google_event
ON events_workshops(google_calendar_event_id)
WHERE google_calendar_event_id IS NOT NULL;

-- 7. Crear función para limpiar tokens cuando se desconecta Google Calendar
CREATE OR REPLACE FUNCTION disconnect_google_calendar(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    google_calendar_connected = FALSE,
    google_access_token = NULL,
    google_refresh_token = NULL,
    google_token_expires_at = NULL,
    google_calendar_id = 'primary'
  WHERE id = user_id;

  -- Limpiar event IDs de appointments
  UPDATE appointments
  SET google_calendar_event_id = NULL
  WHERE professional_id IN (
    SELECT id FROM professional_applications WHERE user_id = user_id
  );

  -- Limpiar event IDs de events_workshops
  UPDATE events_workshops
  SET google_calendar_event_id = NULL
  WHERE created_by = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear política RLS para que los usuarios solo puedan ver sus propios tokens
-- Los tokens de Google son sensibles, solo el dueño debe poder verlos

-- Política para SELECT (solo el usuario puede ver sus propios tokens)
DROP POLICY IF EXISTS "Users can view their own Google Calendar tokens" ON profiles;
CREATE POLICY "Users can view their own Google Calendar tokens"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para UPDATE (solo el usuario puede actualizar sus propios tokens)
DROP POLICY IF EXISTS "Users can update their own Google Calendar tokens" ON profiles;
CREATE POLICY "Users can update their own Google Calendar tokens"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 9. Comentarios en las columnas para documentación
COMMENT ON COLUMN profiles.google_calendar_connected IS 'Indica si el usuario ha conectado su cuenta de Google Calendar';
COMMENT ON COLUMN profiles.google_access_token IS 'Token de acceso de Google Calendar (encriptado)';
COMMENT ON COLUMN profiles.google_refresh_token IS 'Token de refresco de Google Calendar (encriptado)';
COMMENT ON COLUMN profiles.google_token_expires_at IS 'Fecha de expiración del access token';
COMMENT ON COLUMN profiles.google_calendar_id IS 'ID del calendario de Google a usar (default: primary)';

COMMENT ON COLUMN appointments.google_calendar_event_id IS 'ID del evento en Google Calendar asociado a esta cita';
COMMENT ON COLUMN events_workshops.google_calendar_event_id IS 'ID del evento en Google Calendar asociado a este taller';

-- 10. Crear una vista para obtener usuarios con Google Calendar conectado (útil para sincronización)
CREATE OR REPLACE VIEW users_with_google_calendar AS
SELECT
  id,
  email,
  google_calendar_connected,
  google_token_expires_at,
  CASE
    WHEN google_token_expires_at IS NULL THEN FALSE
    WHEN google_token_expires_at < NOW() THEN TRUE
    ELSE FALSE
  END AS token_expired
FROM profiles
WHERE google_calendar_connected = TRUE;

-- Dar permisos a usuarios autenticados para ver la vista
GRANT SELECT ON users_with_google_calendar TO authenticated;

-- 11. Crear función para verificar si un token está por expirar (menos de 5 minutos)
CREATE OR REPLACE FUNCTION is_google_token_expiring(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expires_at TIMESTAMPTZ;
BEGIN
  SELECT google_token_expires_at INTO expires_at
  FROM profiles
  WHERE id = user_id;

  IF expires_at IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN expires_at < (NOW() + INTERVAL '5 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Éxito de la migración
DO $$
BEGIN
  RAISE NOTICE 'Migración de Google Calendar completada exitosamente';
  RAISE NOTICE 'Columnas agregadas a profiles, appointments y events_workshops';
  RAISE NOTICE 'Funciones de utilidad creadas: disconnect_google_calendar, is_google_token_expiring';
  RAISE NOTICE 'Vista creada: users_with_google_calendar';
END $$;
