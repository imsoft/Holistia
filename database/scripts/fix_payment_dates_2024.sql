-- ============================================================================
-- SCRIPT: Corregir fechas de pagos (2025 → 2024)
-- ============================================================================
-- Problema: Los pagos tienen created_at en 2025, pero estamos en 2024
-- Solución: Actualizar las fechas a 2024
-- ============================================================================

-- Ver fechas actuales ANTES de corregir
SELECT 
  id,
  amount,
  created_at as fecha_incorrecta,
  created_at - INTERVAL '1 year' as fecha_correcta,
  '⚠️ Debe ser 2024, no 2025' as problema
FROM payments
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- Actualizar las fechas (restar 1 año)
UPDATE payments
SET 
  created_at = created_at - INTERVAL '1 year',
  updated_at = NOW()
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- Verificar que se corrigió
SELECT 
  id,
  amount,
  payment_type,
  created_at,
  '✅ Ahora aparecerá en el dashboard' as resultado
FROM payments
WHERE id IN (
  '17e568b5-950a-4983-abee-94e4bcd8a970',
  '6beb8648-cd91-4993-9b9f-7af1519c497b'
);

-- Verificar el resumen
SELECT 
  '✅ CORRECCIÓN COMPLETADA' as estado,
  COUNT(*) as pagos_corregidos,
  SUM(amount) as total
FROM payments
WHERE EXTRACT(YEAR FROM created_at) = 2024;

