-- Fix para permitir eliminar professional_applications sin error de constraint en payments
--
-- Problema: Al eliminar una professional_application, se viola el constraint
-- payments_appointment_or_event_check porque el pago de registro no tiene
-- appointment_id ni event_registration_id
--
-- Solución: Modificar el constraint para incluir professional_application_id

-- 1. Eliminar el constraint existente
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_appointment_or_event_check;

-- 2. Crear nuevo constraint que incluya professional_application_id
ALTER TABLE payments
ADD CONSTRAINT payments_reference_check CHECK (
  (
    (appointment_id IS NOT NULL)::integer +
    (event_registration_id IS NOT NULL)::integer +
    (professional_application_id IS NOT NULL)::integer
  ) = 1
);

-- Comentario explicativo
COMMENT ON CONSTRAINT payments_reference_check ON payments IS
'Ensures that a payment is associated with exactly one of: appointment, event registration, or professional application';
