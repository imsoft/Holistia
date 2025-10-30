-- Marca como pagada la cuota de inscripción para Brenda Rodriguez
-- Fecha: 2025-10-30
-- Email: mnr.brendaro@gmail.com

-- Actualizar estado de pago
UPDATE professional_applications
SET
  registration_fee_paid = TRUE,
  registration_fee_amount = COALESCE(registration_fee_amount, 1000.00),
  registration_fee_currency = COALESCE(registration_fee_currency, 'mxn'),
  registration_fee_paid_at = COALESCE(registration_fee_paid_at, NOW()),
  registration_fee_expires_at = COALESCE(registration_fee_expires_at, COALESCE(registration_fee_paid_at, NOW()) + INTERVAL '1 year'),
  is_active = TRUE,
  updated_at = NOW()
WHERE email = 'mnr.brendaro@gmail.com'
  AND first_name = 'Brenda'
  AND last_name = 'Rodriguez';

-- Verificar que la actualización se realizó correctamente
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  is_active,
  registration_fee_paid,
  registration_fee_amount,
  registration_fee_currency,
  registration_fee_paid_at,
  registration_fee_expires_at,
  updated_at
FROM professional_applications
WHERE email = 'mnr.brendaro@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

