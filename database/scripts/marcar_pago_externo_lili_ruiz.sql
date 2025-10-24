-- ============================================================================
-- Script para marcar pago externo de inscripción - Lili Ruiz
-- ============================================================================
-- Fecha: 24 de octubre de 2025
-- Propósito: Marcar como pagada externamente la inscripción de Lili Ruiz
-- 
-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- ============================================================================

-- Profesional a actualizar
-- Nombre: Lilia del Rocio Ruiz Camacho (Lili Ruiz)
-- Email: liliruiz.dance@gmail.com
-- Profesión: Coach
-- ID: 3ec204cd-87a5-4c46-8bd4-3eb3b11f7448

-- Actualizar el registro de pago de inscripción
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE id = '3ec204cd-87a5-4c46-8bd4-3eb3b11f7448'
  AND email = 'liliruiz.dance@gmail.com';

-- Verificar la actualización
SELECT 
  id,
  first_name,
  last_name,
  email,
  profession,
  status,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at,
  CASE 
    WHEN registration_fee_expires_at IS NOT NULL THEN
      EXTRACT(DAY FROM (registration_fee_expires_at - NOW()))::INTEGER
    ELSE NULL
  END as dias_restantes
FROM professional_applications
WHERE id = '3ec204cd-87a5-4c46-8bd4-3eb3b11f7448';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- El query de verificación debe mostrar:
-- - registration_fee_paid: true
-- - registration_fee_paid_at: fecha y hora actual
-- - registration_fee_expires_at: fecha actual + 1 año
-- - dias_restantes: ~365 días
-- ============================================================================

