-- ========================================================================
-- Script para marcar pagos de inscripción realizados fuera de la plataforma
-- Fecha: 24 de octubre de 2025
-- 
-- Profesionales que pagaron por otro medio:
-- - Andrea Olivares Lara (YA MARCADO)
-- - Jessica Flores Valencia
-- - María Jimena
-- ========================================================================

-- Paso 1: Verificar el estado actual de los profesionales
SELECT 
  id,
  first_name,
  last_name,
  email,
  status,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at
FROM professional_applications
WHERE id IN (
  '2b595a8e-7a51-4802-a465-4ad0d2caf73e', -- Jessica Flores Valencia
  '6ef82471-17ed-48c4-bab1-f8526040f538'  -- María Jimena
);

-- Paso 2: Actualizar Jessica Flores Valencia
-- Email: jessflova@gmail.com
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  updated_at = NOW()
WHERE id = '2b595a8e-7a51-4802-a465-4ad0d2caf73e'
  AND registration_fee_paid = false; -- Solo si aún no está marcado como pagado

-- Paso 3: Actualizar María Jimena
-- Email: lamistika.love@gmail.com
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  updated_at = NOW()
WHERE id = '6ef82471-17ed-48c4-bab1-f8526040f538'
  AND registration_fee_paid = false; -- Solo si aún no está marcado como pagado

-- Paso 4: Verificar los cambios
SELECT 
  id,
  first_name,
  last_name,
  email,
  status,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at,
  registration_fee_amount,
  registration_fee_currency
FROM professional_applications
WHERE id IN (
  '5ec3bf08-0d1b-46d6-88a6-98391d25c75b', -- Andrea Olivares Lara (referencia)
  '2b595a8e-7a51-4802-a465-4ad0d2caf73e', -- Jessica Flores Valencia
  '6ef82471-17ed-48c4-bab1-f8526040f538'  -- María Jimena
)
ORDER BY last_name, first_name;

-- ========================================================================
-- NOTAS IMPORTANTES:
-- ========================================================================
-- 
-- 1. Este script marca como pagada la inscripción anual de $1,000 MXN
-- 2. La fecha de expiración se establece a 1 año desde hoy
-- 3. Andrea Olivares Lara ya estaba marcada como pagada (22 oct 2024)
-- 4. Los profesionales deben estar en status 'approved' para aparecer en la plataforma
-- 5. La condición "AND registration_fee_paid = false" previene actualizaciones duplicadas
-- 
-- ========================================================================
-- RESULTADO ESPERADO:
-- ========================================================================
-- 
-- Después de ejecutar este script, los 3 profesionales tendrán:
-- ✅ registration_fee_paid = true
-- ✅ registration_fee_paid_at = [fecha actual]
-- ✅ registration_fee_expires_at = [fecha actual + 1 año]
-- ✅ registration_fee_amount = 1000.00
-- ✅ registration_fee_currency = 'mxn'
-- 
-- Y aparecerán en el listado público de Holistia
-- ========================================================================

