-- ============================================================================
-- Script: Marcar pago de inscripción externo - Erika Mariela Pichardo Larios
-- Fecha: 2025-12-11
-- Descripción: Marca como pagada la inscripción de Erika Mariela Pichardo Larios
--              que pagó por fuera del sistema de Stripe
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar datos actuales del profesional
-- ============================================================================
SELECT
  pa.id,
  pa.user_id,
  pa.first_name,
  pa.last_name,
  pa.email,
  pa.phone,
  pa.status,
  pa.is_active,
  pa.registration_fee_paid,
  pa.registration_fee_paid_at,
  pa.registration_fee_expires_at,
  pa.registration_fee_amount,
  pa.registration_fee_currency,
  pa.registration_fee_payment_id,
  pa.created_at,
  pa.updated_at
FROM professional_applications pa
WHERE pa.email = 'eripi97@gmail.com'
   OR (pa.first_name ILIKE '%Erika%' 
       AND pa.last_name ILIKE '%Pichardo%');

-- ============================================================================
-- PASO 2: Actualizar el estado de pago
-- ============================================================================
-- Este bloque actualiza los campos de pago de inscripción
DO $$
DECLARE
  v_professional_id UUID;
  v_current_amount NUMERIC;
BEGIN
  -- Buscar el ID del profesional
  SELECT id, registration_fee_amount
  INTO v_professional_id, v_current_amount
  FROM professional_applications
  WHERE email = 'eripi97@gmail.com'
     OR (first_name ILIKE '%Erika%' 
         AND last_name ILIKE '%Pichardo%')
  LIMIT 1;

  -- Verificar que se encontró el profesional
  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el profesional con email eripi97@gmail.com o nombre Erika Pichardo';
  END IF;

  -- Usar el monto actual si existe, de lo contrario usar 299.00 (monto estándar actual)
  v_current_amount := COALESCE(v_current_amount, 299.00);

  -- Actualizar professional_applications
  UPDATE professional_applications
  SET
    registration_fee_paid = true,
    registration_fee_paid_at = NOW(),
    registration_fee_expires_at = NOW() + INTERVAL '1 year',
    registration_fee_amount = v_current_amount, -- Mantener el monto actual o usar 299.00
    registration_fee_currency = COALESCE(registration_fee_currency, 'mxn'),
    updated_at = NOW()
  WHERE id = v_professional_id
    AND (registration_fee_paid = false OR registration_fee_paid IS NULL); -- Solo si aún no está marcado como pagado

  RAISE NOTICE 'Profesional actualizado exitosamente. ID: %, Monto: %', v_professional_id, v_current_amount;
END $$;

-- ============================================================================
-- PASO 3: Verificar los cambios aplicados
-- ============================================================================
SELECT
  pa.id,
  pa.first_name,
  pa.last_name,
  pa.email,
  pa.phone,
  pa.status,
  pa.is_active,
  pa.registration_fee_paid,
  pa.registration_fee_paid_at,
  pa.registration_fee_expires_at,
  pa.registration_fee_amount,
  pa.registration_fee_currency,
  CASE
    WHEN pa.registration_fee_expires_at IS NOT NULL THEN
      EXTRACT(DAY FROM (pa.registration_fee_expires_at - NOW()))::INTEGER
    ELSE NULL
  END as dias_restantes,
  CASE
    WHEN pa.registration_fee_paid = true 
         AND pa.registration_fee_expires_at IS NOT NULL 
         AND pa.registration_fee_expires_at > NOW() THEN 'Vigente'
    WHEN pa.registration_fee_paid = true 
         AND (pa.registration_fee_expires_at IS NULL OR pa.registration_fee_expires_at <= NOW()) THEN 'Expirado'
    ELSE 'Sin pagar'
  END as estado_inscripcion,
  pa.updated_at
FROM professional_applications pa
WHERE pa.email = 'eripi97@gmail.com'
   OR (pa.first_name ILIKE '%Erika%' 
       AND pa.last_name ILIKE '%Pichardo%');

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- El query de verificación debe mostrar:
-- - registration_fee_paid: true
-- - registration_fee_paid_at: fecha y hora actual
-- - registration_fee_expires_at: fecha actual + 1 año
-- - dias_restantes: ~365 días
-- - estado_inscripcion: 'Vigente'
-- - registration_fee_amount: 299.00 (o el monto que tenía configurado)
-- - registration_fee_currency: 'mxn'
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
-- 1. Este script marca como pagada la inscripción anual
-- 2. La fecha de expiración se establece a 1 año desde hoy
-- 3. El monto se mantiene si ya tenía uno configurado, de lo contrario usa 299.00
-- 4. Este script es idempotente: puede ejecutarse múltiples veces sin causar problemas
-- 5. Solo actualiza si registration_fee_paid es false o NULL
-- ============================================================================
