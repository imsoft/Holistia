-- Script de diagnóstico para pagos de inscripción de profesionales
-- Ejecutar en Supabase SQL Editor

-- 1. Ver el estado de las aplicaciones de estos profesionales
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
WHERE email IN (
  'ryoga.chan.78@gmail.com',
  '4nacserrano@gmail.com',
  'chamanhinojosa@gmail.com'
)
ORDER BY created_at DESC;

-- 2. Ver los pagos de inscripción asociados a estos profesionales
SELECT
  p.id as payment_id,
  p.payment_type,
  p.amount,
  p.currency,
  p.status as payment_status,
  p.stripe_checkout_session_id,
  p.stripe_payment_intent_id,
  p.paid_at,
  p.created_at,
  pa.email as professional_email,
  pa.first_name,
  pa.last_name
FROM payments p
JOIN professional_applications pa ON p.professional_application_id = pa.id
WHERE pa.email IN (
  'ryoga.chan.78@gmail.com',
  '4nacserrano@gmail.com',
  'chamanhinojosa@gmail.com'
)
AND p.payment_type = 'registration'
ORDER BY p.created_at DESC;

-- 3. Ver TODOS los pagos pendientes de inscripción que tienen session_id pero no están pagados
SELECT
  pa.id as application_id,
  pa.email,
  pa.first_name,
  pa.last_name,
  pa.registration_fee_paid,
  pa.registration_fee_stripe_session_id,
  p.id as payment_id,
  p.status as payment_status,
  p.stripe_checkout_session_id,
  p.stripe_payment_intent_id,
  p.created_at
FROM professional_applications pa
LEFT JOIN payments p ON p.professional_application_id = pa.id AND p.payment_type = 'registration'
WHERE pa.registration_fee_stripe_session_id IS NOT NULL
  AND (pa.registration_fee_paid = false OR pa.registration_fee_paid IS NULL)
ORDER BY pa.created_at DESC;
