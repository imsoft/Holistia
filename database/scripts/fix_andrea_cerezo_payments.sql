-- ============================================================================
-- Script para crear/actualizar pagos de Andrea Cerezo
-- ============================================================================
-- Problema: Las citas no aparecen en las estadísticas porque no tienen
-- pagos con estado 'succeeded'
-- ============================================================================

-- VERIFICAR ESTADO ACTUAL
SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.appointment_time,
  a.status as appointment_status,
  a.cost,
  p.id as payment_id,
  p.status as payment_status
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2';

-- ============================================================================
-- SOLUCIÓN 1: Actualizar el pago existente (Cita del 28 de octubre)
-- ============================================================================

-- Actualizar el pago de 'processing' a 'succeeded'
UPDATE payments
SET 
  status = 'succeeded',
  paid_at = NOW(),
  updated_at = NOW()
WHERE id = '17e568b5-950a-4983-abee-94e4bcd8a970';

-- ============================================================================
-- SOLUCIÓN 2: Crear pago para la cita del 22 de octubre
-- ============================================================================

-- Insertar nuevo registro de pago para la cita que no tiene
INSERT INTO payments (
  id,
  appointment_id,
  patient_id,
  professional_id,
  amount,
  service_amount,
  commission_percentage,
  platform_fee,
  currency,
  status,
  payment_type,
  description,
  paid_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '863d9ef3-7a11-4151-95cb-215c61df025d', -- appointment_id
  'd89373fe-4cf4-4401-a466-0c1efe9a5937', -- patient_id
  '441c1fd3-87c5-4248-a502-381e8e7aacc2', -- professional_id
  700.00, -- amount
  700.00, -- service_amount
  15, -- commission_percentage
  105.00, -- platform_fee (15% de 700)
  'mxn', -- currency
  'succeeded', -- status
  'appointment', -- payment_type
  'Pago externo - Limpia Energética', -- description
  NOW(), -- paid_at
  '2025-10-22 22:36:03.936285+00', -- created_at (fecha de la cita)
  NOW() -- updated_at
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.appointment_time,
  a.status as appointment_status,
  a.cost,
  p.id as payment_id,
  p.status as payment_status,
  p.paid_at,
  CASE 
    WHEN p.status = 'succeeded' THEN '✅ CORRECTO'
    ELSE '❌ AÚN PENDIENTE'
  END as resultado
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
ORDER BY a.appointment_date DESC;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Ambas citas deberían tener:
-- - payment_status: 'succeeded'
-- - paid_at: Una fecha válida
-- - resultado: '✅ CORRECTO'
-- ============================================================================

