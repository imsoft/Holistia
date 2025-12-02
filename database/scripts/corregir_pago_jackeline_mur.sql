-- ============================================
-- Script para corregir el estado de pago de Jackeline Mur
-- ============================================
-- ID del profesional: e1843e80-0d77-4db2-a588-5d0c6776d79b
-- ID del pago: e69e0f39-e689-4230-b991-4cb5de5286b4
-- Stripe Session ID: cs_live_a1B4pbHX9KxSHqGu9nThUjiaZOLTeiKHFnjpVwltBnP8JeZuuFLq7bu9SP
--
-- INSTRUCCIONES:
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. Si el pago no existe o no está en 'succeeded', primero usa el botón 
--    "Sincronizar Pagos" en el dashboard de administración
-- 3. Luego ejecuta este script para asegurar que el profesional esté actualizado
-- ============================================

-- ============================================
-- PASO 1: Verificar el estado actual del pago
-- ============================================
SELECT 
    id,
    payment_type,
    status,
    amount,
    service_amount,
    professional_application_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    paid_at,
    created_at,
    updated_at
FROM payments
WHERE id = 'e69e0f39-e689-4230-b991-4cb5de5286b4'
   OR stripe_checkout_session_id = 'cs_live_a1B4pbHX9KxSHqGu9nThUjiaZOLTeiKHFnjpVwltBnP8JeZuuFLq7bu9SP';

-- ============================================
-- PASO 2: Verificar el estado actual del profesional
-- ============================================
SELECT 
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_payment_id,
    registration_fee_paid_at,
    registration_fee_expires_at,
    registration_fee_stripe_session_id
FROM professional_applications
WHERE id = 'e1843e80-0d77-4db2-a588-5d0c6776d79b';

-- ============================================
-- PASO 3: Si el pago existe pero no está en 'succeeded', actualizarlo primero
-- ============================================
-- NOTA: Si el pago está en 'pending' o 'processing' pero debería estar en 'succeeded',
-- primero actualiza el pago usando la API de sincronización o manualmente.
-- Este script asume que el pago debería estar en 'succeeded' si existe.

-- Actualizar el pago a 'succeeded' si existe y tiene el session_id correcto
UPDATE payments
SET 
    status = 'succeeded',
    paid_at = COALESCE(paid_at, NOW()),
    updated_at = NOW()
WHERE id = 'e69e0f39-e689-4230-b991-4cb5de5286b4'
  AND payment_type = 'registration'
  AND professional_application_id = 'e1843e80-0d77-4db2-a588-5d0c6776d79b'
  AND status IN ('pending', 'processing');

-- ============================================
-- PASO 4: Actualizar el profesional si el pago está en 'succeeded'
-- ============================================
-- Calcular la fecha de expiración (1 año desde la fecha de pago o desde ahora si paid_at es null)
UPDATE professional_applications
SET 
    registration_fee_paid = true,
    registration_fee_paid_at = COALESCE(
        (SELECT paid_at FROM payments WHERE id = 'e69e0f39-e689-4230-b991-4cb5de5286b4'),
        NOW()
    ),
    registration_fee_expires_at = COALESCE(
        (SELECT (paid_at + INTERVAL '1 year') FROM payments WHERE id = 'e69e0f39-e689-4230-b991-4cb5de5286b4'),
        (NOW() + INTERVAL '1 year')
    ),
    updated_at = NOW()
WHERE id = 'e1843e80-0d77-4db2-a588-5d0c6776d79b'
  AND EXISTS (
      SELECT 1 
      FROM payments 
      WHERE id = 'e69e0f39-e689-4230-b991-4cb5de5286b4'
        AND payment_type = 'registration'
        AND status = 'succeeded'
        AND professional_application_id = 'e1843e80-0d77-4db2-a588-5d0c6776d79b'
  );

-- ============================================
-- PASO 5: Verificar el resultado final
-- ============================================
SELECT 
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_payment_id,
    registration_fee_paid_at,
    registration_fee_expires_at,
    registration_fee_stripe_session_id
FROM professional_applications
WHERE id = 'e1843e80-0d77-4db2-a588-5d0c6776d79b';

-- Verificar el estado final del pago
SELECT 
    id,
    payment_type,
    status,
    amount,
    professional_application_id,
    paid_at
FROM payments
WHERE id = 'e69e0f39-e689-4230-b991-4cb5de5286b4';

