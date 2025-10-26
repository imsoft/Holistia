-- Script para verificar cálculos financieros
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar pagos del mes actual
SELECT 
  'PAGOS DEL MES ACTUAL' as seccion,
  COUNT(*) as total_transacciones,
  SUM(amount) as ingresos_totales,
  SUM(amount * 0.15) as comisiones_plataforma_calculadas,
  SUM((amount * 0.036) + 3) as comisiones_stripe_calculadas,
  SUM((amount * 0.15) + ((amount * 0.036) + 3)) * 0.16) as impuestos_calculados,
  SUM((amount * 0.15) - ((amount * 0.036) + 3) - (((amount * 0.15) + ((amount * 0.036) + 3)) * 0.16)) as ingreso_neto_calculado
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing');

-- 2. Desglose por tipo de pago
SELECT 
  'DESGLOSE POR TIPO' as seccion,
  payment_type,
  COUNT(*) as transacciones,
  SUM(amount) as total_monto,
  SUM(amount * 0.15) as comisiones_plataforma,
  SUM((amount * 0.036) + 3) as comisiones_stripe
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing')
GROUP BY payment_type
ORDER BY total_monto DESC;

-- 3. Verificar si hay platform_fee en la BD
SELECT 
  'VERIFICAR PLATFORM_FEE' as seccion,
  COUNT(*) as total_pagos,
  COUNT(platform_fee) as pagos_con_platform_fee,
  COUNT(*) - COUNT(platform_fee) as pagos_sin_platform_fee
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing');

-- 4. Mostrar algunos pagos de ejemplo
SELECT 
  'EJEMPLOS DE PAGOS' as seccion,
  id,
  amount,
  platform_fee,
  payment_type,
  status,
  paid_at
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing')
ORDER BY paid_at DESC
LIMIT 5;
