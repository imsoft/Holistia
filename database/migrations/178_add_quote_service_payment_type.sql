-- ============================================================================
-- MIGRACIÓN 178: Agregar soporte para pagos de servicios con cotización
-- ============================================================================
-- Descripción: Permite crear enlaces de pago para servicios con pricing_type = 'quote'
-- ============================================================================

-- Actualizar el constraint de payment_type para incluir 'quote_service'
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_payment_type_check;

ALTER TABLE public.payments
ADD CONSTRAINT payments_payment_type_check
CHECK (payment_type IN ('appointment', 'event', 'registration', 'quote_service'));

-- Actualizar el constraint para permitir quote_service sin appointment_id ni event_id
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_appointment_or_event_check;

ALTER TABLE public.payments
ADD CONSTRAINT payments_appointment_or_event_check
CHECK (
  (payment_type = 'appointment' AND appointment_id IS NOT NULL AND event_id IS NULL) OR
  (payment_type = 'event' AND event_id IS NOT NULL AND appointment_id IS NULL) OR
  (payment_type = 'registration' AND appointment_id IS NULL AND event_id IS NULL AND professional_application_id IS NOT NULL) OR
  (payment_type = 'quote_service' AND appointment_id IS NULL AND event_id IS NULL AND professional_id IS NOT NULL)
);

-- Agregar columna metadata si no existe (para almacenar información adicional del pago)
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Crear índice para búsquedas por metadata
CREATE INDEX IF NOT EXISTS idx_payments_metadata 
ON public.payments 
USING GIN (metadata);

-- Comentarios
COMMENT ON COLUMN public.payments.metadata IS 'Metadata adicional del pago (ej: service_id, conversation_id para servicios con cotización)';
COMMENT ON CONSTRAINT payments_payment_type_check ON public.payments IS 'Tipos de pago permitidos: appointment, event, registration, quote_service';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
