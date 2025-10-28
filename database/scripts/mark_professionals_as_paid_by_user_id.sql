-- Script Alternativo: Marcar profesionales como pagados usando user_id
-- Fecha: 2025-10-27
-- Descripción: Actualizar el estado de pago usando los IDs de usuario específicos
--              Este script es más seguro ya que usa los IDs únicos

-- IDs de usuario extraídos del JSON proporcionado:
-- Cyntia Flores: c0d243bf-6941-4a11-b5c0-11b991363fdd
-- Esmeralda Garcia: d24ea208-4058-413e-89f3-22ca9e7c7589

-- Actualizar Cyntia Flores por user_id
UPDATE professional_applications 
SET 
    registration_fee_paid = TRUE,
    registration_fee_amount = 1000.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    updated_at = NOW()
WHERE user_id = 'c0d243bf-6941-4a11-b5c0-11b991363fdd';

-- Actualizar Esmeralda Garcia por user_id
UPDATE professional_applications 
SET 
    registration_fee_paid = TRUE,
    registration_fee_amount = 1000.00,
    registration_fee_currency = 'mxn',
    registration_fee_paid_at = NOW(),
    updated_at = NOW()
WHERE user_id = 'd24ea208-4058-413e-89f3-22ca9e7c7589';

-- Verificar que las actualizaciones se realizaron correctamente
SELECT 
    pa.id,
    pa.user_id,
    pa.first_name,
    pa.last_name,
    pa.email,
    pa.registration_fee_paid,
    pa.registration_fee_amount,
    pa.registration_fee_currency,
    pa.registration_fee_paid_at,
    pa.status,
    pa.updated_at,
    au.email as auth_email,
    au.created_at as user_created_at
FROM professional_applications pa
LEFT JOIN auth.users au ON pa.user_id = au.id
WHERE pa.user_id IN (
    'c0d243bf-6941-4a11-b5c0-11b991363fdd',
    'd24ea208-4058-413e-89f3-22ca9e7c7589'
)
ORDER BY pa.first_name, pa.last_name;

-- Mostrar resumen de la operación
SELECT 
    COUNT(*) as total_professionals_updated,
    SUM(CASE WHEN registration_fee_paid = TRUE THEN 1 ELSE 0 END) as paid_professionals,
    SUM(CASE WHEN registration_fee_paid = FALSE THEN 1 ELSE 0 END) as unpaid_professionals,
    STRING_AGG(
        CONCAT(first_name, ' ', last_name, ' (', email, ')'), 
        ', '
    ) as updated_professionals
FROM professional_applications 
WHERE user_id IN (
    'c0d243bf-6941-4a11-b5c0-11b991363fdd',
    'd24ea208-4058-413e-89f3-22ca9e7c7589'
);
