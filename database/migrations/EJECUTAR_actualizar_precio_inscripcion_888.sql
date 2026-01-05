-- =====================================================
-- MIGRACIÓN: Actualizar precio de inscripción a $888 MXN
-- =====================================================
-- Este script actualiza TODOS los registros existentes
-- de $299 (u otros montos) a $888 MXN
-- =====================================================

-- 1. Ver resumen de montos actuales
SELECT
  registration_fee_amount as monto_actual,
  registration_fee_currency as moneda,
  COUNT(*) as total_profesionales,
  COUNT(CASE WHEN registration_fee_paid = true THEN 1 END) as total_pagados,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as total_aprobados,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pendientes
FROM professional_applications
GROUP BY registration_fee_amount, registration_fee_currency
ORDER BY registration_fee_amount;

-- 2. Ver TODOS los profesionales que NO tienen $888
SELECT
  id,
  first_name,
  last_name,
  email,
  status,
  registration_fee_amount as monto_actual,
  registration_fee_currency as moneda,
  registration_fee_paid as pagado,
  registration_fee_expires_at as expira_en,
  created_at
FROM professional_applications
WHERE registration_fee_amount != 888.00 OR registration_fee_amount IS NULL
ORDER BY created_at DESC;

-- 3. Actualizar SOLO los registros que NO HAN PAGADO o están pendientes
-- Los profesionales que YA PAGARON mantienen su monto histórico
UPDATE professional_applications
SET
  registration_fee_amount = 888.00,
  registration_fee_currency = 'mxn'
WHERE (registration_fee_amount != 888.00 OR registration_fee_amount IS NULL)
  AND (
    registration_fee_paid = false
    OR registration_fee_paid IS NULL
  );

-- 4. Verificar que se actualizaron correctamente
-- Profesionales NO PAGADOS ahora con $888
SELECT
  COUNT(*) as total_no_pagados_con_888,
  'Profesionales sin pagar ahora con $888' as descripcion
FROM professional_applications
WHERE registration_fee_amount = 888.00
  AND (registration_fee_paid = false OR registration_fee_paid IS NULL);

-- 5. Verificar que NO queden registros sin pagar con otros montos
SELECT
  COUNT(*) as total_sin_pagar_con_otro_monto,
  'Profesionales sin pagar con monto diferente a $888 (debería ser 0)' as descripcion
FROM professional_applications
WHERE (registration_fee_amount != 888.00 OR registration_fee_amount IS NULL)
  AND (registration_fee_paid = false OR registration_fee_paid IS NULL);

-- 6. Resumen final separado por estado de pago
SELECT
  registration_fee_amount as monto,
  registration_fee_currency as moneda,
  registration_fee_paid as pagado,
  COUNT(*) as total_profesionales,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as total_aprobados,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pendientes
FROM professional_applications
GROUP BY registration_fee_amount, registration_fee_currency, registration_fee_paid
ORDER BY registration_fee_paid DESC, registration_fee_amount;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- PROFESIONALES QUE YA PAGARON:
-- - Mantienen su monto histórico ($1000, $600, $299, etc.)
-- - Ejemplo: Si pagó $299, sigue mostrando $299 en su registro
--
-- PROFESIONALES QUE NO HAN PAGADO:
-- - Ahora tienen registration_fee_amount = 888.00
-- - Cuando intenten pagar, verán $888 MXN
--
-- RESULTADO FINAL:
-- - Los que pagaron $1000 mantienen $1000 (pero con pagado=true)
-- - Los que pagaron $600 mantienen $600 (con pagado=true)
-- - Los que pagaron $299 mantienen $299 (con pagado=true)
-- - Los que NO pagaron (pendientes o a mitad) ahora tienen $888
-- =====================================================
