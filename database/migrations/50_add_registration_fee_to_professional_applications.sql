-- Migración: Agregar campos para el pago de inscripción de profesionales
-- Fecha: 2025-10-22
-- Descripción: Los profesionales deben pagar una cuota de inscripción de $600 MXN
--              para poder aparecer en la plataforma después de ser aprobados.

-- Agregar campos para el pago de inscripción de profesionales
ALTER TABLE professional_applications
ADD COLUMN registration_fee_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN registration_fee_amount NUMERIC DEFAULT 600.00,
ADD COLUMN registration_fee_currency TEXT DEFAULT 'mxn',
ADD COLUMN registration_fee_payment_id UUID,
ADD COLUMN registration_fee_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN registration_fee_stripe_session_id TEXT;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN professional_applications.registration_fee_paid IS 'Indica si el profesional ha pagado la cuota de inscripción de $600 MXN';
COMMENT ON COLUMN professional_applications.registration_fee_amount IS 'Monto de la cuota de inscripción (por defecto $600 MXN)';
COMMENT ON COLUMN professional_applications.registration_fee_currency IS 'Moneda de la cuota de inscripción';
COMMENT ON COLUMN professional_applications.registration_fee_payment_id IS 'ID del pago en la tabla payments';
COMMENT ON COLUMN professional_applications.registration_fee_paid_at IS 'Fecha y hora en que se pagó la cuota de inscripción';
COMMENT ON COLUMN professional_applications.registration_fee_stripe_session_id IS 'ID de la sesión de Stripe Checkout para el pago de inscripción';

-- Agregar restricción de foreign key para el payment_id
ALTER TABLE professional_applications
ADD CONSTRAINT professional_applications_registration_fee_payment_id_fkey
FOREIGN KEY (registration_fee_payment_id)
REFERENCES payments(id)
ON DELETE SET NULL;

-- Crear índice para mejorar las consultas de pagos
CREATE INDEX idx_professional_applications_registration_fee_paid 
ON professional_applications(registration_fee_paid);

CREATE INDEX idx_professional_applications_registration_fee_payment_id 
ON professional_applications(registration_fee_payment_id);

