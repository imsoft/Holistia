-- ============================================================================
-- Script para marcar pago externo de inscripción - Manuel Ontiveros
-- ============================================================================
-- Fecha: 26 de noviembre de 2025
-- Propósito: Marcar como pagada externamente la inscripción de Manuel Ontiveros
-- 
-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- ============================================================================

-- Información del profesional
-- Nombre: Manuel Ontiveros
-- Email: manuelalejandroo@hotmail.com
-- ID de usuario: 0f955ba0-0171-42da-bd55-d059dbbaf5cf
-- ID de aplicación profesional: 2b57d14c-9573-4518-9784-56294d02decf
-- Monto: $299.00 MXN

-- ============================================================================
-- PASO 1: Verificar el estado actual del profesional
-- ============================================================================

-- Verificar si el profesional existe y su estado actual
SELECT 
  pa.id as professional_application_id,
  pa.user_id,
  pa.first_name,
  pa.last_name,
  pa.email,
  pa.status,
  pa.registration_fee_paid,
  pa.registration_fee_paid_at,
  pa.registration_fee_expires_at,
  pa.registration_fee_amount,
  pa.registration_fee_currency,
  pa.registration_fee_payment_id,
  pa.is_active
FROM professional_applications pa
WHERE pa.id = '2b57d14c-9573-4518-9784-56294d02decf'
  AND pa.user_id = '0f955ba0-0171-42da-bd55-d059dbbaf5cf'
  AND pa.email = 'manuelalejandroo@hotmail.com';

-- ============================================================================
-- PASO 2: Crear registro de pago y actualizar aplicación profesional
-- ============================================================================

-- Crear un registro de pago para la inscripción y actualizar professional_applications
-- NOTA: Este pago es externo (no tiene stripe_checkout_session_id)
DO $$
DECLARE
  v_payment_id UUID;
BEGIN
  -- Verificar si ya existe un pago exitoso para evitar duplicados
  SELECT id INTO v_payment_id
  FROM payments
  WHERE professional_application_id = '2b57d14c-9573-4518-9784-56294d02decf'
    AND payment_type = 'registration'
    AND status = 'succeeded'
  LIMIT 1;

  -- Si no existe, crear uno nuevo
  IF v_payment_id IS NULL THEN
    INSERT INTO payments (
      id,
      professional_application_id,
      payment_type,
      amount,
      service_amount,
      commission_percentage,
      currency,
      status,
      patient_id,
      description,
      created_at,
      updated_at,
      paid_at
    )
    VALUES (
      gen_random_uuid(),
      '2b57d14c-9573-4518-9784-56294d02decf',
      'registration',
      299.00,
      299.00,
      100.00,
      'mxn',
      'succeeded',
      '0f955ba0-0171-42da-bd55-d059dbbaf5cf', -- user_id del profesional
      'Cuota de inscripción profesional - Manuel Ontiveros (Pago externo)',
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_payment_id;
  END IF;

  -- Actualizar professional_applications con el payment_id
  UPDATE professional_applications
  SET 
    registration_fee_paid = true,
    registration_fee_paid_at = NOW(),
    registration_fee_expires_at = NOW() + INTERVAL '1 year',
    registration_fee_amount = 299.00,
    registration_fee_currency = 'mxn',
    registration_fee_payment_id = v_payment_id,
    updated_at = NOW()
  WHERE id = '2b57d14c-9573-4518-9784-56294d02decf'
    AND user_id = '0f955ba0-0171-42da-bd55-d059dbbaf5cf'
    AND email = 'manuelalejandroo@hotmail.com'
    AND registration_fee_paid = false; -- Solo si aún no está marcado como pagado
END $$;

-- ============================================================================
-- PASO 3: Verificar los cambios aplicados
-- ============================================================================

-- Verificar que se aplicaron los cambios en professional_applications
SELECT 
  pa.id,
  pa.first_name,
  pa.last_name,
  pa.email,
  pa.status,
  pa.registration_fee_paid,
  pa.registration_fee_paid_at,
  pa.registration_fee_expires_at,
  pa.registration_fee_amount,
  pa.registration_fee_currency,
  pa.registration_fee_payment_id,
  pa.is_active,
  CASE 
    WHEN pa.registration_fee_expires_at IS NOT NULL THEN
      EXTRACT(DAY FROM (pa.registration_fee_expires_at - NOW()))::INTEGER
    ELSE NULL
  END as dias_restantes,
  p.id as payment_id,
  p.status as payment_status,
  p.amount as payment_amount,
  p.description as payment_description
FROM professional_applications pa
LEFT JOIN payments p ON pa.registration_fee_payment_id = p.id
WHERE pa.id = '2b57d14c-9573-4518-9784-56294d02decf'
  AND pa.user_id = '0f955ba0-0171-42da-bd55-d059dbbaf5cf';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- El query de verificación debe mostrar:
-- - registration_fee_paid: true
-- - registration_fee_paid_at: fecha y hora actual
-- - registration_fee_expires_at: fecha actual + 1 año
-- - dias_restantes: ~365 días
-- - registration_fee_payment_id: UUID del pago creado
-- - payment_id: UUID del pago en la tabla payments
-- - payment_status: 'succeeded'
-- - payment_amount: 299.00
-- 
-- El profesional ahora debería aparecer en la plataforma si:
-- - status = 'approved' ✅
-- - is_active = true ✅
-- - registration_fee_paid = true ✅
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- 1. Este script marca como pagada la inscripción anual de $299.00 MXN
-- 2. La fecha de expiración se establece a 1 año desde hoy
-- 3. Se crea un registro en la tabla payments para mantener el historial
-- 4. La condición "AND registration_fee_paid = false" previene actualizaciones duplicadas
-- 5. El profesional debe estar en status 'approved' y is_active = true para aparecer en la plataforma
-- 6. El pago se marca como 'succeeded' aunque sea externo
-- 7. Si ya existe un pago exitoso, se reutiliza su ID en lugar de crear uno duplicado
-- 
-- ============================================================================
-- SEGURIDAD:
-- ============================================================================
-- 
-- El script incluye múltiples verificaciones de seguridad:
-- - Verificación por id, user_id Y email
-- - Condición para evitar actualizaciones duplicadas
-- - Queries de verificación para confirmar los cambios
-- - Verificación de pago existente para evitar duplicados
-- 
-- ============================================================================
