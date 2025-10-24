-- ============================================================================
-- SCRIPT DE CORRECCIÓN AUTOMÁTICA - VERSIÓN SUPABASE
-- ============================================================================
-- ⚠️ ADVERTENCIA: Este script modificará datos en tu base de datos
-- Ejecuta primero el diagnóstico para ver qué problemas hay
-- ============================================================================

-- ============================================================================
-- PARTE 1: CREAR PAGOS FALTANTES
-- ============================================================================
-- Crea registros de pago para citas confirmadas que no tienen pago

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
SELECT 
  gen_random_uuid(),
  a.id,
  a.patient_id,
  a.professional_id,
  a.cost,
  a.cost,
  15,
  (a.cost * 0.15),
  'mxn',
  'succeeded',
  'appointment',
  'Pago registrado automáticamente - Cita confirmada previamente',
  a.created_at,
  a.created_at,
  NOW()
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE p.id IS NULL
  AND a.status IN ('confirmed', 'completed')
  AND a.professional_id IN (SELECT id FROM professional_applications);

-- Ver cuántos se crearon
SELECT 
  '✅ Pagos creados' as resultado,
  COUNT(*) as cantidad
FROM payments
WHERE description = 'Pago registrado automáticamente - Cita confirmada previamente';

-- ============================================================================
-- PARTE 2: ACTUALIZAR PAGOS CON ESTADO INCORRECTO
-- ============================================================================
-- Actualiza pagos que están en processing, pending, etc. a succeeded

UPDATE payments p
SET 
  status = 'succeeded',
  paid_at = COALESCE(paid_at, NOW()),
  updated_at = NOW()
FROM appointments a
WHERE p.appointment_id = a.id
  AND p.status != 'succeeded'
  AND a.status IN ('confirmed', 'completed');

-- Ver cuántos se actualizaron
SELECT 
  '✅ Pagos actualizados' as resultado,
  COUNT(*) as cantidad
FROM payments p
INNER JOIN appointments a ON p.appointment_id = a.id
WHERE p.status = 'succeeded'
  AND a.status IN ('confirmed', 'completed');

-- ============================================================================
-- PARTE 3: VERIFICACIÓN FINAL
-- ============================================================================

SELECT 
  '📊 VERIFICACIÓN FINAL' as seccion,
  '' as espacio;

-- Contar problemas restantes
SELECT 
  'Citas sin pago' as problema,
  COUNT(*) as cantidad_restante
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE p.id IS NULL 
  AND a.status IN ('confirmed', 'completed')

UNION ALL

SELECT 
  'Pagos no exitosos' as problema,
  COUNT(*) as cantidad_restante
FROM appointments a
INNER JOIN payments p ON p.appointment_id = a.id
WHERE p.status != 'succeeded' 
  AND a.status IN ('confirmed', 'completed');

-- ============================================================================
-- NOTA SOBRE PROFESSIONAL_ID INVÁLIDOS
-- ============================================================================
-- Los professional_id inválidos NO se pueden corregir automáticamente
-- porque requieren saber cuál es el professional_id correcto.
-- 
-- Si tienes citas con professional_id inválido, corrígelas manualmente:
--
-- UPDATE appointments
-- SET professional_id = 'el_id_correcto_aqui'
-- WHERE id = 'id_de_la_cita_aqui';
-- ============================================================================

SELECT 
  '✅ CORRECCIÓN COMPLETADA' as resultado,
  'Ejecuta el diagnóstico de nuevo para verificar' as siguiente_paso;

