-- ============================================================================
-- Script para marcar pago externo de inscripción - María Gomez
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Marcar como pagada externamente la inscripción de María Gomez
-- 
-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- ============================================================================

-- Información del usuario
-- Nombre: María Gomez
-- Email: mariagpegomez@gmail.com
-- ID de usuario: db19210a-7e8a-4a52-a1da-150aa7eef6ab
-- Tipo: patient (pero necesita convertirse a profesional)

-- ============================================================================
-- PASO 1: Verificar el estado actual del usuario
-- ============================================================================

-- Verificar si el usuario existe y su estado actual
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  pa.id as professional_application_id,
  pa.first_name,
  pa.last_name,
  pa.email as pa_email,
  pa.status,
  pa.registration_fee_paid,
  pa.registration_fee_paid_at,
  pa.registration_fee_expires_at
FROM auth.users u
LEFT JOIN professional_applications pa ON u.id = pa.user_id
WHERE u.email = 'mariagpegomez@gmail.com'
  AND u.id = 'db19210a-7e8a-4a52-a1da-150aa7eef6ab';

-- ============================================================================
-- PASO 2: Buscar la aplicación profesional de María Gomez
-- ============================================================================

-- Buscar la aplicación profesional por email
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  registration_fee_paid,
  registration_fee_paid_at,
  registration_fee_expires_at,
  created_at
FROM professional_applications
WHERE email = 'mariagpegomez@gmail.com'
  OR user_id = 'db19210a-7e8a-4a52-a1da-150aa7eef6ab';

-- ============================================================================
-- PASO 3: Actualizar el registro de pago de inscripción
-- ============================================================================

-- Actualizar el registro de pago de inscripción en professional_applications
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  updated_at = NOW()
WHERE email = 'mariagpegomez@gmail.com'
  AND user_id = 'db19210a-7e8a-4a52-a1da-150aa7eef6ab'
  AND registration_fee_paid = false; -- Solo si aún no está marcado como pagado

-- ============================================================================
-- PASO 4: NOTA SOBRE PAGOS EXTERNOS
-- ============================================================================
-- 
-- Para pagos externos (realizados fuera de la plataforma), NO se crea
-- un registro en la tabla payments ya que:
-- 1. No hay transacción de Stripe asociada
-- 2. La restricción payments_appointment_or_event_check no permite
--    pagos de tipo 'registration' sin appointment_id o event_id
-- 3. Los pagos externos se manejan solo en professional_applications
-- 
-- Si en el futuro se necesita crear registros en payments para pagos
-- externos, será necesario actualizar la restricción de la base de datos.

-- ============================================================================
-- PASO 5: Verificar los cambios aplicados
-- ============================================================================

-- Verificar que se aplicaron los cambios en professional_applications
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
  registration_fee_currency,
  registration_fee_payment_id,
  CASE 
    WHEN registration_fee_expires_at IS NOT NULL THEN
      EXTRACT(DAY FROM (registration_fee_expires_at - NOW()))::INTEGER
    ELSE NULL
  END as dias_restantes
FROM professional_applications
WHERE email = 'mariagpegomez@gmail.com'
  AND user_id = 'db19210a-7e8a-4a52-a1da-150aa7eef6ab';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- El query de verificación debe mostrar:
-- - registration_fee_paid: true
-- - registration_fee_paid_at: fecha y hora actual
-- - registration_fee_expires_at: fecha actual + 1 año
-- - dias_restantes: ~365 días
-- - registration_fee_payment_id: NULL (porque es pago externo)
-- 
-- NOTA: Para pagos externos NO se crea registro en la tabla payments
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- 1. Este script marca como pagada la inscripción anual de $1,000 MXN
-- 2. La fecha de expiración se establece a 1 año desde hoy
-- 3. Para pagos externos NO se crea registro en la tabla payments
-- 4. La condición "AND registration_fee_paid = false" previene actualizaciones duplicadas
-- 5. El profesional debe estar en status 'approved' para aparecer en la plataforma
-- 6. Los pagos externos se manejan solo en professional_applications
-- 
-- ============================================================================
-- SEGURIDAD:
-- ============================================================================
-- 
-- El script incluye múltiples verificaciones de seguridad:
-- - Verificación por email Y user_id
-- - Condición para evitar actualizaciones duplicadas
-- - Queries de verificación para confirmar los cambios
-- 
-- ============================================================================
