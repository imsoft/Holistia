-- Migración para agregar soporte de Stripe Connect
-- Permite que profesionales y organizadores de eventos reciban pagos directamente
-- con comisiones automáticas para la plataforma

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

