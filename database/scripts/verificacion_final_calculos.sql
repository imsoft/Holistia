-- VERIFICACIÓN FINAL DE CÁLCULOS FINANCIEROS
-- Lógica correcta según explicación del usuario

-- 1. EJEMPLO DETALLADO CON $700
SELECT 
  '💰 EJEMPLO $700' as seccion,
  'Monto original' as concepto,
  700.00 as valor

UNION ALL

SELECT 
  '💰 EJEMPLO $700' as seccion,
  'Comisión Stripe base (3.6% + $3)' as concepto,
  ROUND((700.00 * 0.036) + 3, 2) as valor

UNION ALL

SELECT 
  '💰 EJEMPLO $700' as seccion,
  'IVA sobre Stripe (16%)' as concepto,
  ROUND(((700.00 * 0.036) + 3) * 0.16, 2) as valor

UNION ALL

SELECT 
  '💰 EJEMPLO $700' as seccion,
  'Comisión total Stripe' as concepto,
  ROUND((700.00 * 0.036) + 3 + (((700.00 * 0.036) + 3) * 0.16), 2) as valor

UNION ALL

SELECT 
  '💰 EJEMPLO $700' as seccion,
  'Comisión plataforma (15%)' as concepto,
  ROUND(700.00 * 0.15, 2) as valor

UNION ALL

SELECT 
  '💰 EJEMPLO $700' as seccion,
  'Ingreso neto Holistia' as concepto,
  ROUND(700.00 * 0.15 - ((700.00 * 0.036) + 3 + (((700.00 * 0.036) + 3) * 0.16)), 2) as valor

UNION ALL

SELECT 
  '💰 EJEMPLO $700' as seccion,
  'Importe neto profesional' as concepto,
  ROUND(700.00 - (700.00 * 0.15), 2) as valor;

-- 2. DATOS REALES DE LA BASE DE DATOS
SELECT 
  '📊 DATOS REALES' as seccion,
  amount as monto_original,
  ROUND((amount * 0.036) + 3, 2) as comision_stripe_base,
  ROUND(((amount * 0.036) + 3) * 0.16, 2) as impuesto_iva,
  ROUND((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16), 2) as comision_total_stripe,
  ROUND(amount * 0.15, 2) as comision_plataforma,
  ROUND(amount * 0.15 - ((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16)), 2) as ingreso_neto_holistia,
  ROUND(amount - (amount * 0.15), 2) as importe_neto_profesional
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing')
ORDER BY amount DESC;

-- 3. TOTALES
SELECT 
  '📊 TOTALES' as seccion,
  COUNT(*) as transacciones,
  SUM(amount) as ingresos_totales,
  SUM(ROUND(amount * 0.15, 2)) as comisiones_plataforma_total,
  SUM(ROUND((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16), 2)) as comisiones_stripe_total,
  SUM(ROUND(amount * 0.15 - ((amount * 0.036) + 3 + (((amount * 0.036) + 3) * 0.16)), 2)) as ingreso_neto_holistia_total,
  SUM(ROUND(amount - (amount * 0.15), 2)) as importe_neto_profesionales_total
FROM public.payments 
WHERE EXTRACT(YEAR FROM paid_at) = 2025 
  AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
  AND status IN ('succeeded', 'processing');
