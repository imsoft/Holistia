-- ============================================
-- Script para corregir TODOS los pagos de registro desincronizados
-- ============================================
-- Este script busca todos los pagos de registro que están en 'succeeded'
-- pero el professional_applications no está marcado como pagado
-- ============================================

-- PASO 1: Identificar pagos desincronizados
SELECT 
    p.id as payment_id,
    p.status as payment_status,
    p.paid_at as payment_paid_at,
    pa.id as professional_id,
    pa.first_name,
    pa.last_name,
    pa.email,
    pa.registration_fee_paid,
    pa.registration_fee_paid_at,
    pa.registration_fee_expires_at
FROM payments p
INNER JOIN professional_applications pa ON p.professional_application_id = pa.id
WHERE p.payment_type = 'registration'
  AND p.status = 'succeeded'
  AND (
    pa.registration_fee_paid = false 
    OR pa.registration_fee_paid_at IS NULL
    OR pa.registration_fee_expires_at IS NULL
  );

-- PASO 2: Actualizar todos los profesionales con pagos desincronizados
UPDATE professional_applications pa
SET 
    registration_fee_paid = true,
    registration_fee_paid_at = COALESCE(
        (SELECT paid_at FROM payments WHERE id = pa.registration_fee_payment_id),
        (SELECT paid_at FROM payments 
         WHERE professional_application_id = pa.id 
           AND payment_type = 'registration' 
           AND status = 'succeeded' 
         ORDER BY paid_at DESC LIMIT 1),
        NOW()
    ),
    registration_fee_expires_at = COALESCE(
        (SELECT (paid_at + INTERVAL '1 year') FROM payments WHERE id = pa.registration_fee_payment_id),
        (SELECT (paid_at + INTERVAL '1 year') FROM payments 
         WHERE professional_application_id = pa.id 
           AND payment_type = 'registration' 
           AND status = 'succeeded' 
         ORDER BY paid_at DESC LIMIT 1),
        (NOW() + INTERVAL '1 year')
    ),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 
    FROM payments p
    WHERE p.professional_application_id = pa.id
      AND p.payment_type = 'registration'
      AND p.status = 'succeeded'
      AND (
        pa.registration_fee_paid = false 
        OR pa.registration_fee_paid_at IS NULL
        OR pa.registration_fee_expires_at IS NULL
      )
);

-- PASO 3: Verificar el resultado
SELECT 
    pa.id,
    pa.first_name,
    pa.last_name,
    pa.email,
    pa.registration_fee_paid,
    pa.registration_fee_paid_at,
    pa.registration_fee_expires_at,
    p.id as payment_id,
    p.status as payment_status,
    p.paid_at as payment_paid_at
FROM professional_applications pa
LEFT JOIN payments p ON p.professional_application_id = pa.id 
    AND p.payment_type = 'registration' 
    AND p.status = 'succeeded'
WHERE pa.registration_fee_paid = true
ORDER BY pa.registration_fee_paid_at DESC;

