-- Script de Verificación: Verificar que los profesionales existen antes de marcar como pagados
-- Fecha: 2025-10-27
-- Descripción: Verificar que los profesionales existen en la base de datos
--              antes de ejecutar las actualizaciones de pago

-- Verificar Cyntia Flores
SELECT 
    'Cyntia Flores' as nombre_completo,
    pa.id,
    pa.user_id,
    pa.first_name,
    pa.last_name,
    pa.email,
    pa.status,
    pa.registration_fee_paid,
    pa.registration_fee_amount,
    pa.created_at,
    au.email as auth_email,
    au.created_at as user_created_at
FROM professional_applications pa
LEFT JOIN auth.users au ON pa.user_id = au.id
WHERE pa.email = 'florescyntia09@gmail.com'
AND pa.first_name = 'Cyntia'
AND pa.last_name = 'Flores';

-- Verificar Esmeralda Garcia
SELECT 
    'Esmeralda Garcia' as nombre_completo,
    pa.id,
    pa.user_id,
    pa.first_name,
    pa.last_name,
    pa.email,
    pa.status,
    pa.registration_fee_paid,
    pa.registration_fee_amount,
    pa.created_at,
    au.email as auth_email,
    au.created_at as user_created_at
FROM professional_applications pa
LEFT JOIN auth.users au ON pa.user_id = au.id
WHERE pa.email = 'malama.espaciocreativo@gmail.com'
AND pa.first_name = 'Esmeralda'
AND pa.last_name = 'Garcia';

-- Verificar por user_id también
SELECT 
    'Verificación por user_id' as tipo_verificacion,
    pa.id,
    pa.user_id,
    pa.first_name,
    pa.last_name,
    pa.email,
    pa.status,
    pa.registration_fee_paid,
    pa.created_at
FROM professional_applications pa
WHERE pa.user_id IN (
    'c0d243bf-6941-4a11-b5c0-11b991363fdd',
    'd24ea208-4058-413e-89f3-22ca9e7c7589'
)
ORDER BY pa.first_name, pa.last_name;

-- Resumen de verificación
SELECT 
    COUNT(*) as total_professionals_found,
    STRING_AGG(
        CONCAT(first_name, ' ', last_name, ' (', email, ')'), 
        ', '
    ) as found_professionals
FROM professional_applications 
WHERE email IN (
    'florescyntia09@gmail.com',
    'malama.espaciocreativo@gmail.com'
)
OR user_id IN (
    'c0d243bf-6941-4a11-b5c0-11b991363fdd',
    'd24ea208-4058-413e-89f3-22ca9e7c7589'
);
