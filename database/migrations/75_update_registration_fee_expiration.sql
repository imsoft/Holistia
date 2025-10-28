-- Migración: Actualizar registration_fee_expires_at para profesionales que ya pagaron
-- Fecha: 2025-10-28
-- Descripción: Establecer fecha de expiración para profesionales que ya pagaron
--              pero no tienen fecha de expiración configurada

-- Actualizar Cyntia Flores
UPDATE professional_applications 
SET 
    registration_fee_expires_at = registration_fee_paid_at + INTERVAL '1 year',
    updated_at = NOW()
WHERE email = 'florescyntia09@gmail.com'
AND first_name = 'Cyntia'
AND last_name = 'Flores'
AND registration_fee_paid = true
AND registration_fee_expires_at IS NULL;

-- Actualizar Esmeralda Garcia
UPDATE professional_applications 
SET 
    registration_fee_expires_at = registration_fee_paid_at + INTERVAL '1 year',
    updated_at = NOW()
WHERE email = 'malama.espaciocreativo@gmail.com'
AND first_name = 'Esmeralda'
AND last_name = 'Garcia'
AND registration_fee_paid = true
AND registration_fee_expires_at IS NULL;

-- Verificar que las actualizaciones se realizaron correctamente
SELECT 
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_paid_at,
    registration_fee_expires_at,
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
    SUM(CASE WHEN registration_fee_paid = TRUE AND registration_fee_expires_at IS NOT NULL THEN 1 ELSE 0 END) as paid_with_expiration,
    SUM(CASE WHEN registration_fee_paid = TRUE AND registration_fee_expires_at IS NULL THEN 1 ELSE 0 END) as paid_without_expiration,
    SUM(CASE WHEN registration_fee_paid = FALSE THEN 1 ELSE 0 END) as unpaid_professionals
FROM professional_applications 
WHERE email IN (
    'florescyntia09@gmail.com',
    'malama.espaciocreativo@gmail.com'
);
