-- Script para verificar cálculos financieros CORRECTOS
-- Basado en la lógica real: IVA solo sobre comisiones de Stripe

-- 1. RESUMEN GENERAL CON CÁLCULOS CORRECTOS
SELECT 
  '📊 RESUMEN CORRECTO' as seccion,
  COUNT(*) as total_transacciones,
  SUM(amount) as ingresos_totales,
  SUM(amount * 0.15) as comisiones_plataforma,
  SUM((amount * 0.036) + 3) as comisiones_stripe_base,
  SUM(((amount * 0.036) + 3) * 0.16) as impuestos_iva_stripe,
  SUM((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16)) as comision_total_stripe,
  SUM((amount * 0.15) - ((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16))) as ingreso_neto_holistia
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing');

-- 2. DETALLE POR TRANSACCIÓN CON CÁLCULOS CORRECTOS
SELECT 
  '🔍 DETALLE CORRECTO' as seccion,
  amount,
  ROUND(amount * 0.15, 2) as comision_plataforma,
  ROUND((amount * 0.036) + 3, 2) as comision_stripe_base,
  ROUND(((amount * 0.036) + 3) * 0.16, 2) as impuesto_iva_stripe,
  ROUND((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16), 2) as comision_total_stripe,
  ROUND((amount * 0.15) - ((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16)), 2) as ingreso_neto_holistia,
  ROUND(amount - ((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16)) - (amount * 0.15), 2) as importe_neto_profesional
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing')
ORDER BY amount DESC;

-- 3. VERIFICACIÓN MANUAL CON EJEMPLO DE $700
SELECT 
  '✅ VERIFICACIÓN $700' as seccion,
  700.00 as monto_original,
  ROUND(700.00 * 0.15, 2) as comision_plataforma_105,
  ROUND((700.00 * 0.036) + 3, 2) as comision_stripe_base_28_20,
  ROUND(((700.00 * 0.036) + 3) * 0.16, 2) as impuesto_iva_4_51,
  ROUND((700.00 * 0.036) + 3 + (((700.00 * 0.036) + 3) * 0.16), 2) as comision_total_stripe_32_71,
  ROUND(700.00 * 0.15 - ((700.00 * 0.036) + 3 + (((700.00 * 0.036) + 3) * 0.16)), 2) as ingreso_neto_holistia_72_29,
  ROUND(700.00 - ((700.00 * 0.036) + 3 + (((700.00 * 0.036) + 3) * 0.16)) - (700.00 * 0.15), 2) as importe_neto_profesional_595;
