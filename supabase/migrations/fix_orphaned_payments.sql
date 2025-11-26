-- Fix para pagos huérfanos que no tienen ninguna referencia
--
-- Problema: Hay pagos de tipo 'registration' que no tienen professional_application_id
-- porque fueron creados antes de que existiera ese campo o por un error en el proceso
--
-- Solución: Asociar estos pagos con su professional_application correcta usando el patient_id

-- Actualizar pagos de registro que no tienen professional_application_id
-- pero que deberían tenerlo basándonos en el patient_id
UPDATE payments p
SET professional_application_id = pa.id
FROM professional_applications pa
WHERE
  p.payment_type = 'registration'
  AND p.professional_application_id IS NULL
  AND p.patient_id = pa.user_id
  AND p.appointment_id IS NULL
  AND p.event_registration_id IS NULL;

-- Verificar que no queden pagos huérfanos
-- Si quedan, eliminarlos (son datos corruptos)
DELETE FROM payments
WHERE
  payment_type = 'registration'
  AND appointment_id IS NULL
  AND event_registration_id IS NULL
  AND professional_application_id IS NULL;
