-- ============================================================================
-- MIGRACIÓN: Corregir función disconnect_google_calendar para usar owner_id
-- ============================================================================
-- Esta migración corrige la función disconnect_google_calendar para usar
-- owner_id en lugar de created_by, ya que la estructura de events_workshops
-- cambió en la migración 41.
-- ============================================================================

-- Actualizar función para limpiar tokens cuando se desconecta Google Calendar
CREATE OR REPLACE FUNCTION disconnect_google_calendar(user_id UUID)
RETURNS VOID AS $$
DECLARE
  p_user_id UUID;
BEGIN
  -- Asignar parámetro a variable local para evitar ambigüedad en subconsultas
  p_user_id := user_id;
  -- Actualizar perfil del usuario
  UPDATE profiles
  SET
    google_calendar_connected = FALSE,
    google_access_token = NULL,
    google_refresh_token = NULL,
    google_token_expires_at = NULL,
    google_calendar_id = 'primary'
  WHERE id = p_user_id;

  -- Limpiar event IDs de appointments
  -- Usar alias de tabla y variable local para evitar ambigüedad
  UPDATE appointments
  SET google_calendar_event_id = NULL
  WHERE professional_id IN (
    SELECT pa.id FROM professional_applications pa WHERE pa.user_id = p_user_id
  );

  -- Limpiar event IDs de events_workshops usando owner_id en lugar de created_by
  UPDATE events_workshops
  SET google_calendar_event_id = NULL
  WHERE owner_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para documentar la corrección
COMMENT ON FUNCTION disconnect_google_calendar(UUID) IS 'Desconecta Google Calendar del usuario, limpiando tokens y event IDs. Actualizado para usar owner_id en lugar de created_by.';

