-- ========================================================================
-- SCRIPT RÁPIDO: Marcar pagos externos de Jessica y María Jimena
-- COPIA Y PEGA ESTE SCRIPT COMPLETO EN SUPABASE SQL EDITOR
-- ========================================================================

-- Paso 1: Ver estado actual
SELECT 
  first_name || ' ' || last_name AS nombre,
  email,
  registration_fee_paid AS pagado_antes
FROM professional_applications
WHERE id IN (
  '2b595a8e-7a51-4802-a465-4ad0d2caf73e', -- Jessica
  '6ef82471-17ed-48c4-bab1-f8526040f538'  -- María Jimena
);

-- Paso 2: Actualizar Jessica Flores Valencia
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  updated_at = NOW()
WHERE id = '2b595a8e-7a51-4802-a465-4ad0d2caf73e';

-- Paso 3: Actualizar María Jimena
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  updated_at = NOW()
WHERE id = '6ef82471-17ed-48c4-bab1-f8526040f538';

-- Paso 4: Verificar cambios aplicados
SELECT 
  first_name || ' ' || last_name AS nombre,
  email,
  registration_fee_paid AS pagado_ahora,
  registration_fee_paid_at AS fecha_pago,
  registration_fee_expires_at AS expira
FROM professional_applications
WHERE id IN (
  '2b595a8e-7a51-4802-a465-4ad0d2caf73e',
  '6ef82471-17ed-48c4-bab1-f8526040f538'
);

-- ========================================================================
-- RESULTADO ESPERADO:
-- Ambas profesionales deben tener pagado_ahora = true
-- Y fecha de expiración debe ser 1 año desde hoy
-- ========================================================================

