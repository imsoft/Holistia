-- Script para marcar como pagadas las inscripciones de Armida De la Garza y Mark Aguayo
-- Estos profesionales pagaron externamente (fuera de la plataforma)
-- Fecha de ejecución: 2025-12-29

-- IMPORTANTE: Ejecutar estas consultas UNA POR UNA y verificar los resultados antes de continuar

-- 1. VERIFICAR PRIMERO el estado actual
SELECT
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_paid_at,
    registration_fee_expires_at
FROM professional_applications
WHERE email IN ('armidadelagarza@gmail.com', 'mark.arechiga@gmail.com');

-- 2. ACTUALIZAR Armida De la Garza
-- Marcar como pagada con fecha actual y expiración en 1 año
UPDATE professional_applications
SET
    registration_fee_paid = true,
    registration_fee_amount = 299.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    registration_fee_expires_at = NOW() + INTERVAL '1 year',
    updated_at = NOW()
WHERE email = 'armidadelagarza@gmail.com'
    AND status = 'approved';

-- Verificar la actualización de Armida
SELECT
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_paid_at,
    registration_fee_expires_at
FROM professional_applications
WHERE email = 'armidadelagarza@gmail.com';

-- 3. ACTUALIZAR Mark Aguayo
-- Marcar como pagada con fecha actual y expiración en 1 año
UPDATE professional_applications
SET
    registration_fee_paid = true,
    registration_fee_amount = 299.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    registration_fee_expires_at = NOW() + INTERVAL '1 year',
    updated_at = NOW()
WHERE email = 'mark.arechiga@gmail.com'
    AND status = 'approved';

-- Verificar la actualización de Mark
SELECT
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_paid_at,
    registration_fee_expires_at
FROM professional_applications
WHERE email = 'mark.arechiga@gmail.com';

-- 4. VERIFICACIÓN FINAL
-- Ver el estado final de ambos profesionales
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
    is_active
FROM professional_applications
WHERE email IN ('armidadelagarza@gmail.com', 'mark.arechiga@gmail.com')
ORDER BY email;

-- 5. OPCIONAL: Crear registro de pago manual en la tabla payments
-- Esto es opcional pero ayuda a mantener un registro histórico
-- Primero obtener los IDs de los profesionales
DO $$
DECLARE
    armida_id UUID;
    mark_id UUID;
BEGIN
    -- Obtener ID de Armida
    SELECT id INTO armida_id
    FROM professional_applications
    WHERE email = 'armidadelagarza@gmail.com'
    LIMIT 1;

    -- Obtener ID de Mark
    SELECT id INTO mark_id
    FROM professional_applications
    WHERE email = 'mark.arechiga@gmail.com'
    LIMIT 1;

    -- Insertar registro de pago para Armida (solo si no existe)
    IF armida_id IS NOT NULL THEN
        INSERT INTO payments (
            professional_id,
            amount,
            currency,
            status,
            payment_type,
            description,
            created_at,
            updated_at
        )
        SELECT
            armida_id,
            299.00,
            'mxn',
            'succeeded',
            'registration',
            'Pago de inscripción anual (registrado manualmente - pago externo)',
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM payments
            WHERE professional_id = armida_id
            AND payment_type = 'registration'
            AND status = 'succeeded'
        );

        RAISE NOTICE 'Registro de pago creado para Armida De la Garza (ID: %)', armida_id;
    END IF;

    -- Insertar registro de pago para Mark (solo si no existe)
    IF mark_id IS NOT NULL THEN
        INSERT INTO payments (
            professional_id,
            amount,
            currency,
            status,
            payment_type,
            description,
            created_at,
            updated_at
        )
        SELECT
            mark_id,
            299.00,
            'mxn',
            'succeeded',
            'registration',
            'Pago de inscripción anual (registrado manualmente - pago externo)',
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM payments
            WHERE professional_id = mark_id
            AND payment_type = 'registration'
            AND status = 'succeeded'
        );

        RAISE NOTICE 'Registro de pago creado para Mark Aguayo (ID: %)', mark_id;
    END IF;
END $$;

-- 6. VERIFICACIÓN FINAL de pagos
SELECT
    p.id,
    pa.first_name,
    pa.last_name,
    pa.email,
    p.amount,
    p.status,
    p.payment_type,
    p.description,
    p.created_at
FROM payments p
JOIN professional_applications pa ON p.professional_id = pa.id
WHERE pa.email IN ('armidadelagarza@gmail.com', 'mark.arechiga@gmail.com')
    AND p.payment_type = 'registration'
ORDER BY pa.email, p.created_at DESC;
