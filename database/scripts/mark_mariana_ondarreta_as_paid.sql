-- Script para marcar a Mariana Ondarreta como si hubiera pagado su inscripción
-- Email: holisticobymariana@gmail.com
-- Nombre: Mariana Ondarreta
-- Fecha: 2025-12-11

-- ============================================================================
-- 1. VERIFICAR PROFESIONAL ANTES DE ACTUALIZAR
-- ============================================================================

DO $$
DECLARE
  v_professional_id UUID;
  v_current_amount NUMERIC;
  v_current_paid BOOLEAN;
BEGIN
  -- Buscar el profesional por email o nombre
  SELECT 
    id,
    registration_fee_amount,
    registration_fee_paid
  INTO 
    v_professional_id,
    v_current_amount,
    v_current_paid
  FROM professional_applications
  WHERE email = 'holisticobymariana@gmail.com'
     OR (first_name ILIKE '%Mariana%' AND last_name ILIKE '%Ondarreta%')
  LIMIT 1;

  -- Verificar que se encontró el profesional
  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el profesional Mariana Ondarreta con email holisticobymariana@gmail.com';
  END IF;

  -- Mostrar información actual
  RAISE NOTICE 'Profesional encontrado:';
  RAISE NOTICE '  ID: %', v_professional_id;
  RAISE NOTICE '  Monto actual: %', COALESCE(v_current_amount::TEXT, 'NULL');
  RAISE NOTICE '  Estado de pago actual: %', COALESCE(v_current_paid::TEXT, 'NULL');

  -- Si ya está marcado como pagado, mostrar advertencia
  IF v_current_paid = TRUE THEN
    RAISE WARNING 'El profesional ya está marcado como pagado. Se actualizará la fecha de pago y expiración.';
  END IF;
END $$;

-- ============================================================================
-- 2. ACTUALIZAR ESTADO DE PAGO
-- ============================================================================

UPDATE professional_applications
SET 
  registration_fee_paid = TRUE,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  -- Establecer el monto a 888.00 (monto estándar actual de inscripción)
  registration_fee_amount = 888.00,
  registration_fee_currency = COALESCE(registration_fee_currency, 'mxn')
WHERE email = 'holisticobymariana@gmail.com'
   OR (first_name ILIKE '%Mariana%' AND last_name ILIKE '%Ondarreta%');

-- ============================================================================
-- 3. VERIFICAR ACTUALIZACIÓN
-- ============================================================================

SELECT 
  id,
  first_name || ' ' || last_name AS nombre_completo,
  email,
  profession,
  registration_fee_paid AS pago_realizado,
  registration_fee_amount AS monto,
  registration_fee_currency AS moneda,
  registration_fee_paid_at AS fecha_pago,
  registration_fee_expires_at AS fecha_expiracion,
  EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) AS dias_restantes
FROM professional_applications
WHERE email = 'holisticobymariana@gmail.com'
   OR (first_name ILIKE '%Mariana%' AND last_name ILIKE '%Ondarreta%');

-- ============================================================================
-- 4. RESUMEN
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM professional_applications
  WHERE (email = 'holisticobymariana@gmail.com'
     OR (first_name ILIKE '%Mariana%' AND last_name ILIKE '%Ondarreta%'))
    AND registration_fee_paid = TRUE;

  IF v_count > 0 THEN
    RAISE NOTICE '✅ Actualización exitosa: Mariana Ondarreta ahora aparece como pagada';
  ELSE
    RAISE WARNING '⚠️ No se pudo verificar la actualización. Revisa manualmente.';
  END IF;
END $$;
