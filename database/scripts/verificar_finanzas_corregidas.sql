-- ============================================================================
-- Script para verificar que las finanzas están corregidas
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Verificar que el dashboard de finanzas ahora muestra los datos correctos
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar pagos de octubre 2025 usando paid_at (CORRECTO)
-- ============================================================================

SELECT 
  '📅 PAGOS DE OCTUBRE 2025 (usando paid_at)' as seccion,
  COUNT(*) as total_pagos,
  SUM(amount) as ingresos_totales,
  payment_type,
  status,
  MIN(paid_at) as primer_pago,
  MAX(paid_at) as ultimo_pago
FROM payments
WHERE paid_at >= '2025-10-01'::date
  AND paid_at < '2025-11-01'::date
  AND status = 'succeeded'
GROUP BY payment_type, status
ORDER BY payment_type, status;

-- ============================================================================
-- PASO 2: Verificar pagos de octubre 2025 usando created_at (INCORRECTO)
-- ============================================================================

SELECT 
  '📅 PAGOS DE OCTUBRE 2025 (usando created_at - INCORRECTO)' as seccion,
  COUNT(*) as total_pagos,
  SUM(amount) as ingresos_totales,
  payment_type,
  status
FROM payments
WHERE created_at >= '2025-10-01'::date
  AND created_at < '2025-11-01'::date
  AND status = 'succeeded'
GROUP BY payment_type, status
ORDER BY payment_type, status;

-- ============================================================================
-- PASO 3: Comparar ambos métodos
-- ============================================================================

SELECT 
  '🔍 COMPARACIÓN DE MÉTODOS' as seccion,
  'paid_at (CORRECTO)' as metodo,
  COUNT(*) as total_pagos,
  SUM(amount) as ingresos_totales
FROM payments
WHERE paid_at >= '2025-10-01'::date
  AND paid_at < '2025-11-01'::date
  AND status = 'succeeded'

UNION ALL

SELECT 
  '🔍 COMPARACIÓN DE MÉTODOS' as seccion,
  'created_at (INCORRECTO)' as metodo,
  COUNT(*) as total_pagos,
  SUM(amount) as ingresos_totales
FROM payments
WHERE created_at >= '2025-10-01'::date
  AND created_at < '2025-11-01'::date
  AND status = 'succeeded';

-- ============================================================================
-- PASO 4: Verificar detalles de los pagos
-- ============================================================================

SELECT 
  '📊 DETALLES DE PAGOS' as seccion,
  id,
  payment_type,
  amount,
  status,
  created_at,
  paid_at,
  EXTRACT(EPOCH FROM (paid_at - created_at))/3600 as horas_diferencia
FROM payments
WHERE status = 'succeeded'
ORDER BY paid_at DESC;

-- ============================================================================
-- PASO 5: Calcular métricas del dashboard
-- ============================================================================

WITH current_payments AS (
  SELECT 
    amount,
    payment_type,
    status
  FROM payments
  WHERE paid_at >= '2025-10-01'::date
    AND paid_at < '2025-11-01'::date
    AND status = 'succeeded'
)
SELECT 
  '💰 MÉTRICAS DEL DASHBOARD' as seccion,
  COUNT(*) as total_transacciones,
  SUM(amount) as ingresos_totales,
  SUM(amount) * 0.15 as comisiones_plataforma,
  SUM(amount) * 0.036 + (COUNT(*) * 3) as comisiones_stripe,
  (SUM(amount) * 0.15) - (SUM(amount) * 0.036 + (COUNT(*) * 3)) as ingreso_neto_estimado
FROM current_payments;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- 
-- El dashboard de finanzas ahora debería mostrar:
-- - Ingresos Totales: $5,144.00
-- - Comisiones Plataforma: ~$771.60 (15%)
-- - Transacciones: 2
-- - Ingreso Neto: ~$771.60 - costos Stripe
-- 
-- ============================================================================
