-- ========================================================================
-- Script para marcar pagos de inscripción para profesionales
-- Fecha: 2025-11-XX
-- 
-- Profesionales que ya pagaron los $1,000 MXN de inscripción:
-- 1. Aura Pereira Molina - contacto@aurabienestarintegral.com
-- 2. Stephany Rodríguez López - stephanyrodriguez@gmail.com
-- 3. Brenda Rodriguez - mnr.brendaro@gmail.com
-- ========================================================================

-- ========================================
-- PASO 1: VERIFICACIÓN
-- ========================================

-- Verificar que los profesionales existen
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  status,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at,
  is_active
FROM professional_applications
WHERE email IN (
  'contacto@aurabienestarintegral.com',
  'stephanyrodriguez@gmail.com',
  'mnr.brendaro@gmail.com'
)
ORDER BY first_name, last_name;

-- ========================================
-- PASO 2: ACTUALIZACIÓN
-- ========================================

-- Actualizar Aura Pereira Molina
UPDATE professional_applications
SET 
  registration_fee_paid = TRUE,
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  registration_fee_paid_at = COALESCE(registration_fee_paid_at, NOW()),
  registration_fee_expires_at = COALESCE(
    registration_fee_expires_at, 
    COALESCE(registration_fee_paid_at, NOW()) + INTERVAL '1 year'
  ),
  updated_at = NOW()
WHERE email = 'contacto@aurabienestarintegral.com'
  AND first_name ILIKE '%Aura%'
  AND last_name ILIKE '%Pereira%';

-- Actualizar Stephany Rodríguez López
UPDATE professional_applications
SET 
  registration_fee_paid = TRUE,
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  registration_fee_paid_at = COALESCE(registration_fee_paid_at, NOW()),
  registration_fee_expires_at = COALESCE(
    registration_fee_expires_at, 
    COALESCE(registration_fee_paid_at, NOW()) + INTERVAL '1 year'
  ),
  updated_at = NOW()
WHERE email = 'stephanyrodriguez@gmail.com'
  AND first_name ILIKE '%Stephany%';

-- Actualizar Brenda Rodriguez
UPDATE professional_applications
SET 
  registration_fee_paid = TRUE,
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  registration_fee_paid_at = COALESCE(registration_fee_paid_at, NOW()),
  registration_fee_expires_at = COALESCE(
    registration_fee_expires_at, 
    COALESCE(registration_fee_paid_at, NOW()) + INTERVAL '1 year'
  ),
  updated_at = NOW()
WHERE email = 'mnr.brendaro@gmail.com'
  AND first_name ILIKE '%Brenda%';

-- ========================================
-- PASO 3: VERIFICACIÓN FINAL
-- ========================================

-- Verificar que las actualizaciones se realizaron correctamente
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  status,
  is_active,
  registration_fee_paid,
  registration_fee_amount,
  registration_fee_currency,
  registration_fee_paid_at,
  registration_fee_expires_at,
  updated_at
FROM professional_applications
WHERE email IN (
  'contacto@aurabienestarintegral.com',
  'stephanyrodriguez@gmail.com',
  'mnr.brendaro@gmail.com'
)
ORDER BY first_name, last_name;

-- Mostrar resumen de la operación
SELECT 
  COUNT(*) as total_professionals,
  SUM(CASE WHEN registration_fee_paid = TRUE THEN 1 ELSE 0 END) as paid_professionals,
  SUM(CASE WHEN registration_fee_paid = FALSE THEN 1 ELSE 0 END) as unpaid_professionals,
  SUM(CASE WHEN status = 'approved' AND registration_fee_paid = TRUE THEN 1 ELSE 0 END) as approved_and_paid
FROM professional_applications
WHERE email IN (
  'contacto@aurabienestarintegral.com',
  'stephanyrodriguez@gmail.com',
  'mnr.brendaro@gmail.com'
);
