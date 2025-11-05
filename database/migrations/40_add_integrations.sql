-- ============================================================================
-- MIGRACIÓN: Agregar integraciones (Google Calendar y Stripe Connect)
-- ============================================================================
-- Esta migración combina:
-- - Integración de Google Calendar
-- - Integración de Stripe Connect
-- ============================================================================

-- ============================================================================
-- PARTE 1: INTEGRACIÓN DE GOOGLE CALENDAR
-- ============================================================================

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

-- 8. Crear función para verificar si un token está por expirar (menos de 5 minutos)
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

-- 9. Crear una vista para obtener usuarios con Google Calendar conectado
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

GRANT SELECT ON users_with_google_calendar TO authenticated;

-- 10. Comentarios en las columnas para documentación
COMMENT ON COLUMN profiles.google_calendar_connected IS 'Indica si el usuario ha conectado su cuenta de Google Calendar';
COMMENT ON COLUMN profiles.google_access_token IS 'Token de acceso de Google Calendar (encriptado)';
COMMENT ON COLUMN profiles.google_refresh_token IS 'Token de refresco de Google Calendar (encriptado)';
COMMENT ON COLUMN profiles.google_token_expires_at IS 'Fecha de expiración del access token';
COMMENT ON COLUMN profiles.google_calendar_id IS 'ID del calendario de Google a usar (default: primary)';
COMMENT ON COLUMN appointments.google_calendar_event_id IS 'ID del evento en Google Calendar asociado a esta cita';
COMMENT ON COLUMN events_workshops.google_calendar_event_id IS 'ID del evento en Google Calendar asociado a este taller';

-- ============================================================================
-- PARTE 2: INTEGRACIÓN DE STRIPE CONNECT
-- ============================================================================

-- 1. Agregar campos de Stripe Connect a professional_applications
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected' CHECK (stripe_account_status IN ('not_connected', 'pending', 'connected', 'restricted')),
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP WITH TIME ZONE;

-- 2. Agregar campos de Stripe Connect a events_workshops
ALTER TABLE public.events_workshops
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected' CHECK (stripe_account_status IN ('not_connected', 'pending', 'connected', 'restricted')),
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP WITH TIME ZONE;

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_professional_applications_stripe_account_id 
ON public.professional_applications(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_events_workshops_stripe_account_id 
ON public.events_workshops(stripe_account_id);

-- 4. Agregar campos de transferencia a la tabla payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS transfer_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS transfer_status TEXT DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'completed', 'failed', 'reversed'));

-- 5. Crear índice para stripe_transfer_id
CREATE INDEX IF NOT EXISTS idx_payments_stripe_transfer_id 
ON public.payments(stripe_transfer_id);

-- 6. Comentarios en las columnas
COMMENT ON COLUMN public.professional_applications.stripe_account_id IS 'ID de cuenta de Stripe Connect del profesional';
COMMENT ON COLUMN public.professional_applications.stripe_account_status IS 'Estado de la cuenta de Stripe Connect: not_connected, pending, connected, restricted';
COMMENT ON COLUMN public.professional_applications.stripe_onboarding_completed IS 'Indica si el profesional completó el proceso de onboarding de Stripe';
COMMENT ON COLUMN public.professional_applications.stripe_charges_enabled IS 'Indica si la cuenta puede recibir pagos';
COMMENT ON COLUMN public.professional_applications.stripe_payouts_enabled IS 'Indica si la cuenta puede recibir transferencias';
COMMENT ON COLUMN public.professional_applications.stripe_connected_at IS 'Fecha y hora en que se conectó la cuenta de Stripe';

COMMENT ON COLUMN public.events_workshops.stripe_account_id IS 'ID de cuenta de Stripe Connect del organizador del evento';
COMMENT ON COLUMN public.events_workshops.stripe_account_status IS 'Estado de la cuenta de Stripe Connect: not_connected, pending, connected, restricted';
COMMENT ON COLUMN public.events_workshops.stripe_onboarding_completed IS 'Indica si el organizador completó el proceso de onboarding de Stripe';
COMMENT ON COLUMN public.events_workshops.stripe_charges_enabled IS 'Indica si la cuenta puede recibir pagos';
COMMENT ON COLUMN public.events_workshops.stripe_payouts_enabled IS 'Indica si la cuenta puede recibir transferencias';
COMMENT ON COLUMN public.events_workshops.stripe_connected_at IS 'Fecha y hora en que se conectó la cuenta de Stripe';

COMMENT ON COLUMN public.payments.stripe_transfer_id IS 'ID de la transferencia en Stripe Connect';
COMMENT ON COLUMN public.payments.transfer_amount IS 'Monto transferido al profesional/organizador (después de comisión)';
COMMENT ON COLUMN public.payments.platform_fee IS 'Comisión de la plataforma';
COMMENT ON COLUMN public.payments.transfer_status IS 'Estado de la transferencia: pending, completed, failed, reversed';

