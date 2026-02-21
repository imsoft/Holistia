-- Script para marcar el pago de inscripción como completado
-- Profesional: geralpao0998@gmail.com
-- Fecha: 2025-02-20
--
-- CONTEXTO: El profesional se dio de alta pero aparece como que aún no ha pagado.
-- Este script actualiza manualmente el estado del pago de inscripción.
--
-- Ejecutar en Supabase SQL Editor (paso a paso o todo junto)

-- ============================================================
-- PASO 1: DIAGNÓSTICO - Ver el estado actual del profesional
-- ============================================================
SELECT
  id,
  email,
  first_name,
  last_name,
  status,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at,
  registration_fee_stripe_session_id,
  registration_fee_payment_id,
  created_at
FROM professional_applications
WHERE email = 'geralpao0998@gmail.com';

-- Ver pagos asociados (si existen)
SELECT
  p.id as payment_id,
  p.payment_type,
  p.amount,
  p.status as payment_status,
  p.stripe_checkout_session_id,
  p.paid_at,
  pa.email
FROM payments p
JOIN professional_applications pa ON p.professional_application_id = pa.id
WHERE pa.email = 'geralpao0998@gmail.com'
  AND p.payment_type = 'registration';

-- ============================================================
-- PASO 2: ACTUALIZAR professional_applications
-- ============================================================
-- Marca registration_fee_paid = true y establece fechas
-- registration_fee_expires_at = 1 año desde hoy
UPDATE professional_applications
SET
  registration_fee_paid = true,
  registration_fee_paid_at = COALESCE(registration_fee_paid_at, NOW()),
  registration_fee_expires_at = COALESCE(
    registration_fee_expires_at,
    (COALESCE(registration_fee_paid_at, NOW()) + INTERVAL '1 year')::timestamptz
  ),
  registration_fee_amount = COALESCE(registration_fee_amount, 888),
  registration_fee_currency = COALESCE(registration_fee_currency, 'mxn'),
  updated_at = NOW()
WHERE email = 'geralpao0998@gmail.com';

-- ============================================================
-- PASO 3: ACTUALIZAR payments (si existe registro)
-- ============================================================
-- Si hay un pago de tipo 'registration' asociado, actualizarlo a succeeded
UPDATE payments p
SET
  status = 'succeeded',
  paid_at = COALESCE(paid_at, NOW()),
  transfer_status = 'completed',
  updated_at = NOW()
FROM professional_applications pa
WHERE p.professional_application_id = pa.id
  AND pa.email = 'geralpao0998@gmail.com'
  AND p.payment_type = 'registration'
  AND p.status IN ('pending', 'processing');

-- ============================================================
-- PASO 4: CREAR pago si no existía (opcional)
-- ============================================================
-- Solo ejecutar si en el diagnóstico no había registro en payments
-- y necesitas trazabilidad. Requiere user_id del profesional.
--
-- NOTA: Si el profesional nunca llegó a la pantalla de pago de Stripe,
-- puede que no exista registro en payments. En ese caso, la actualización
-- del PASO 2 es suficiente para que la plataforma reconozca que "pagó".
--
-- Si necesitas crear el registro de pago, descomenta y ajusta:
/*
INSERT INTO payments (
  payment_type,
  amount,
  service_amount,
  commission_percentage,
  currency,
  status,
  patient_id,
  professional_application_id,
  description,
  paid_at
)
SELECT
  'registration',
  888,
  888,
  100,
  'mxn',
  'succeeded',
  pa.user_id,
  pa.id,
  'Cuota de inscripción - marcado manualmente por admin',
  NOW()
FROM professional_applications pa
WHERE pa.email = 'geralpao0998@gmail.com'
  AND pa.registration_fee_paid = true
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.professional_application_id = pa.id
      AND p.payment_type = 'registration'
  );
*/

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT
  id,
  email,
  first_name,
  last_name,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at
FROM professional_applications
WHERE email = 'geralpao0998@gmail.com';
