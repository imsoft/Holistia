-- Marca como pagada la cuota de inscripción a 3 profesionales que pagaron por fuera
-- Fecha: 2025-10-30

-- Datos de referencia
-- 1) Aldo Irving AGUIRRE LERMA  | email: misceleohm@gmail.com
-- 2) Adriana ACEVES             | email: adyaceveso@hotmail.com
-- 3) Ivonne Campos              | email: iaracelicampos@gmail.com

-- =====================
-- Verificación previa
-- =====================
SELECT id, user_id, first_name, last_name, email, status, registration_fee_paid
FROM professional_applications
WHERE email IN (
  'misceleohm@gmail.com',
  'adyaceveso@hotmail.com',
  'iaracelicampos@gmail.com'
);

-- =====================
-- Actualización de pago
-- =====================
UPDATE professional_applications
SET
  registration_fee_paid = TRUE,
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  registration_fee_paid_at = NOW(),
  updated_at = NOW()
WHERE email IN (
  'misceleohm@gmail.com',
  'adyaceveso@hotmail.com',
  'iaracelicampos@gmail.com'
);

-- =====================
-- Verificación posterior
-- =====================
SELECT id, user_id, first_name, last_name, email, status,
       registration_fee_paid, registration_fee_amount, registration_fee_currency, registration_fee_paid_at
FROM professional_applications
WHERE email IN (
  'misceleohm@gmail.com',
  'adyaceveso@hotmail.com',
  'iaracelicampos@gmail.com'
)
ORDER BY first_name, last_name;


