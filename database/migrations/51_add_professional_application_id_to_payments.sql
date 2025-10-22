-- Migración: Agregar campo professional_application_id a la tabla payments
-- Fecha: 2025-10-22
-- Descripción: Relacionar pagos de inscripción con las aplicaciones profesionales

-- Agregar columna para relacionar pagos con aplicaciones profesionales
ALTER TABLE payments
ADD COLUMN professional_application_id UUID;

-- Agregar comentario
COMMENT ON COLUMN payments.professional_application_id IS 'ID de la aplicación profesional para pagos de inscripción';

-- Agregar restricción de foreign key
ALTER TABLE payments
ADD CONSTRAINT payments_professional_application_id_fkey
FOREIGN KEY (professional_application_id)
REFERENCES professional_applications(id)
ON DELETE SET NULL;

-- Crear índice para mejorar las consultas
CREATE INDEX idx_payments_professional_application_id 
ON payments(professional_application_id);

-- Actualizar el check constraint del payment_type para incluir 'registration'
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments 
ADD CONSTRAINT payments_payment_type_check 
CHECK (payment_type = ANY (ARRAY['appointment'::text, 'event'::text, 'registration'::text]));

