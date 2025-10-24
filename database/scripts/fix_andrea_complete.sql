-- ============================================================================
-- SCRIPT DE CORRECCIÓN COMPLETA PARA ANDREA CEREZO
-- ============================================================================
-- Fecha: 24 de octubre de 2025
-- Propósito: Eliminar pago duplicado y actualizar estado de cita
-- ============================================================================

-- Profesional: Andrea Cerezo
-- professional_id: 441c1fd3-87c5-4248-a502-381e8e7aacc2

-- ============================================================================
-- PROBLEMA DETECTADO:
-- ============================================================================
-- 1. Cita del 22 oct ($700) tiene 2 pagos duplicados:
--    - Payment ID: 6beb8648-cd91-4993-9b9f-7af1519c497b (MANTENER)
--    - Payment ID: 6fb402bd-e9f9-4d99-a64e-b5640ee35566 (ELIMINAR - duplicado)
--
-- 2. Cita del 28 oct ($4,444) está en estado "pending" pero tiene pago exitoso
--    - Appointment ID: 64e7e5b5-64dc-4ab2-b35e-85830453b1ad
--    - Debe cambiar a "confirmed"
-- ============================================================================

-- Paso 1: Verificar estado actual ANTES de los cambios
SELECT 
  '🔍 ESTADO ANTES DE CORRECCIÓN' as seccion,
  '' as espacio;

SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.status as cita_status,
  a.cost,
  COUNT(p.id) as num_payments,
  SUM(p.amount) as total_pagado
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id AND p.status = 'succeeded'
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
GROUP BY a.id, a.appointment_date, a.status, a.cost
ORDER BY a.appointment_date;

-- ============================================================================
-- CORRECCIÓN 1: Eliminar pago duplicado
-- ============================================================================

DELETE FROM payments
WHERE id = '6fb402bd-e9f9-4d99-a64e-b5640ee35566';

SELECT 
  '✅ Pago duplicado eliminado' as resultado,
  '6fb402bd-e9f9-4d99-a64e-b5640ee35566' as payment_id_eliminado;

-- ============================================================================
-- CORRECCIÓN 2: Actualizar estado de cita a "confirmed"
-- ============================================================================

UPDATE appointments
SET 
  status = 'confirmed',
  updated_at = NOW()
WHERE id = '64e7e5b5-64dc-4ab2-b35e-85830453b1ad';

SELECT 
  '✅ Estado de cita actualizado' as resultado,
  '64e7e5b5-64dc-4ab2-b35e-85830453b1ad' as appointment_id_actualizado,
  'pending → confirmed' as cambio;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 
  '📊 ESTADO DESPUÉS DE CORRECCIÓN' as seccion,
  '' as espacio;

SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.status as cita_status,
  a.cost,
  COUNT(p.id) as num_payments,
  SUM(p.amount) as total_pagado,
  CASE 
    WHEN COUNT(p.id) = 1 AND a.status IN ('confirmed', 'completed') THEN '✅ CORRECTO'
    ELSE '⚠️ Revisar'
  END as diagnostico
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id AND p.status = 'succeeded'
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
GROUP BY a.id, a.appointment_date, a.status, a.cost
ORDER BY a.appointment_date;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT 
  '✅ CORRECCIÓN COMPLETADA' as resultado,
  '' as espacio;

SELECT 
  'Citas totales' as metrica,
  COUNT(DISTINCT a.id) as valor
FROM appointments a
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'

UNION ALL

SELECT 
  'Citas confirmadas' as metrica,
  COUNT(DISTINCT a.id) as valor
FROM appointments a
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
  AND a.status IN ('confirmed', 'completed')

UNION ALL

SELECT 
  'Total pagos exitosos' as metrica,
  COUNT(p.id) as valor
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
  AND p.status = 'succeeded'

UNION ALL

SELECT 
  'Ingresos totales' as metrica,
  COALESCE(SUM(p.amount), 0) as valor
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
  AND p.status = 'succeeded';

-- ============================================================================
-- INSTRUCCIONES FINALES
-- ============================================================================
--
-- Después de ejecutar este script:
-- 1. Andrea debería ver 2 citas (ambas confirmadas)
-- 2. Dashboard debería mostrar:
--    - Citas Hoy: (según la fecha de hoy)
--    - Pacientes Activos: 1
--    - Ingresos del Mes: $5,144 ($4,444 + $700)
-- 3. Ambas citas deberían mostrar badge verde "Pagado"
-- 
-- Si los valores aún no aparecen correctamente, verifica:
-- - Que la migración 57_fix_professionals_appointments_rls.sql esté aplicada
-- - Que el código actualizado esté desplegado en producción
-- ============================================================================

