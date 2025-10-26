-- ============================================================================
-- Script para corregir fechas de pagos que tienen created_at en 2024
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Corregir el desfase de un año en created_at de los pagos
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar el estado actual
-- ============================================================================

SELECT 
  '🔍 ESTADO ACTUAL DE LOS PAGOS' as seccion,
  id,
  amount,
  created_at as fecha_creacion_actual,
  paid_at as fecha_pago,
  EXTRACT(YEAR FROM created_at) as año_creacion,
  EXTRACT(YEAR FROM paid_at) as año_pago
FROM payments
WHERE status = 'succeeded'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: Corregir fechas de created_at para que coincidan con paid_at
-- ============================================================================

-- Actualizar created_at para que sea igual a paid_at (o ligeramente anterior)
UPDATE payments
SET 
  created_at = paid_at - INTERVAL '1 minute',
  updated_at = NOW()
WHERE status = 'succeeded'
  AND EXTRACT(YEAR FROM created_at) = 2024
  AND EXTRACT(YEAR FROM paid_at) = 2025;

-- ============================================================================
-- PASO 3: Verificar que se aplicaron los cambios
-- ============================================================================

SELECT 
  '✅ VERIFICACIÓN DESPUÉS DE LA CORRECCIÓN' as seccion,
  id,
  amount,
  created_at as fecha_creacion_corregida,
  paid_at as fecha_pago,
  EXTRACT(YEAR FROM created_at) as año_creacion,
  EXTRACT(YEAR FROM paid_at) as año_pago,
  CASE 
    WHEN EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM paid_at) 
    THEN '✅ CORREGIDO' 
    ELSE '❌ AÚN TIENE PROBLEMA' 
  END as estado
FROM payments
WHERE status = 'succeeded'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 4: Verificar que el dashboard de finanzas ahora funciona correctamente
-- ============================================================================

-- Verificar pagos de octubre 2025 usando created_at (ahora debería funcionar)
SELECT 
  '📊 VERIFICACIÓN DASHBOARD DE FINANZAS' as seccion,
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
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- 1. Este script corrige el desfase de un año en created_at
-- 2. Los pagos ahora tendrán created_at en 2025 (coincidiendo con paid_at)
-- 3. El dashboard de finanzas funcionará correctamente con ambos filtros
-- 4. No se pierde información, solo se corrige la fecha de creación
-- 
-- ============================================================================
