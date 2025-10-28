-- Script: Marcar profesionales como que ya pagaron la cuota de inscripción
-- Fecha: 2025-10-27
-- Descripción: Actualizar el estado de pago para profesionales específicos
--              que ya realizaron el pago de inscripción de $1,000 MXN

-- Lista de profesionales que ya pagaron (extraídos del JSON proporcionado)
-- Cyntia Flores - florescyntia09@gmail.com
-- Esmeralda Garcia - malama.espaciocreativo@gmail.com

-- Actualizar Cyntia Flores
UPDATE professional_applications 
SET 
    registration_fee_paid = TRUE,
    registration_fee_amount = 1000.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    updated_at = NOW()
WHERE email = 'florescyntia09@gmail.com'
AND first_name = 'Cyntia'
AND last_name = 'Flores';

-- Actualizar Esmeralda Garcia
UPDATE professional_applications 
SET 
    registration_fee_paid = TRUE,
    registration_fee_amount = 1000.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    updated_at = NOW()
WHERE email = 'malama.espaciocreativo@gmail.com'
AND first_name = 'Esmeralda'
AND last_name = 'Garcia';

-- Verificar que las actualizaciones se realizaron correctamente
SELECT 
    id,
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_amount,
    registration_fee_currency,
    registration_fee_paid_at,
    status,
    updated_at
FROM professional_applications 
WHERE email IN (
    'florescyntia09@gmail.com',
    'malama.espaciocreativo@gmail.com'
)
ORDER BY first_name, last_name;

-- Mostrar resumen de la operación
SELECT 
    COUNT(*) as total_professionals_updated,
    SUM(CASE WHEN registration_fee_paid = TRUE THEN 1 ELSE 0 END) as paid_professionals,
    SUM(CASE WHEN registration_fee_paid = FALSE THEN 1 ELSE 0 END) as unpaid_professionals
FROM professional_applications 
WHERE email IN (
    'florescyntia09@gmail.com',
    'malama.espaciocreativo@gmail.com'
);
