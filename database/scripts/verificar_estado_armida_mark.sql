-- Script para verificar el estado de pago de Armida De la Garza y Mark Aguayo
-- Ejecutar este script para ver el estado actual en la base de datos

-- Verificar Armida De la Garza
SELECT
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_amount,
    registration_fee_currency,
    registration_fee_paid_at,
    registration_fee_expires_at,
    status,
    is_active,
    created_at
FROM professional_applications
WHERE email = 'armidadelagarza@gmail.com';

-- Verificar Mark Aguayo
SELECT
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_amount,
    registration_fee_currency,
    registration_fee_paid_at,
    registration_fee_expires_at,
    status,
    is_active,
    created_at
FROM professional_applications
WHERE email = 'mark.arechiga@gmail.com';

-- Ver también si hay pagos de registro en la tabla de payments
SELECT
    p.id,
    p.payment_type,
    p.status,
    p.amount,
    p.professional_id,
    pa.email,
    pa.first_name,
    pa.last_name,
    p.created_at
FROM payments p
JOIN professional_applications pa ON p.professional_id = pa.id
WHERE pa.email IN ('armidadelagarza@gmail.com', 'mark.arechiga@gmail.com')
    AND p.payment_type = 'registration'
ORDER BY p.created_at DESC;
