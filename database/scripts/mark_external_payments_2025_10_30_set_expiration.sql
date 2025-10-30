-- Completar datos de pago (paid_at, expires_at) y activar cuentas
-- Profesionales: Aldo Irving Aguirre Lerma, Adriana Aceves, Ivonne Campos
-- Fecha: 2025-10-30

-- Asegurar pagado y fecha de pago
UPDATE professional_applications
SET
  registration_fee_paid = TRUE,
  registration_fee_amount = COALESCE(registration_fee_amount, 1000.00),
  registration_fee_currency = COALESCE(registration_fee_currency, 'mxn'),
  registration_fee_paid_at = COALESCE(registration_fee_paid_at, NOW()),
  registration_fee_expires_at = COALESCE(registration_fee_expires_at, COALESCE(registration_fee_paid_at, NOW()) + INTERVAL '1 year'),
  is_active = TRUE,
  updated_at = NOW()
WHERE email IN (
  'misceleohm@gmail.com',
  'adyaceveso@hotmail.com',
  'iaracelicampos@gmail.com'
);

-- Verificación
SELECT first_name, last_name, email, status, is_active,
       registration_fee_paid, registration_fee_paid_at, registration_fee_expires_at
FROM professional_applications
WHERE email IN (
  'misceleohm@gmail.com',
  'adyaceveso@hotmail.com',
  'iaracelicampos@gmail.com'
)
ORDER BY first_name, last_name;


