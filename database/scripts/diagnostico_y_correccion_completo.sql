-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO Y CORRECCIÓN COMPLETA - TODOS LOS PROFESIONALES
-- ============================================================================
-- Fecha: 24 de octubre de 2025
-- Propósito: Detectar y corregir problemas comunes en citas y pagos
-- ============================================================================

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO - Detectar problemas
-- ============================================================================

\echo '═══════════════════════════════════════════════════════════════'
\echo '  DIAGNÓSTICO: Buscando problemas en citas y pagos'
\echo '═══════════════════════════════════════════════════════════════'

-- Problema 1: Citas sin registro de pago
\echo ''
\echo '1️⃣ CITAS SIN REGISTRO DE PAGO:'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.cost,
  pa.first_name || ' ' || pa.last_name as profesional,
  pa.email as profesional_email
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE p.id IS NULL
  AND a.status IN ('confirmed', 'completed')
ORDER BY a.appointment_date DESC;

-- Problema 2: Pagos con estado incorrecto
\echo ''
\echo '2️⃣ PAGOS CON ESTADO NO EXITOSO:'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.status as cita_status,
  p.id as payment_id,
  p.status as payment_status,
  pa.first_name || ' ' || pa.last_name as profesional
FROM appointments a
INNER JOIN payments p ON p.appointment_id = a.id
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE p.status != 'succeeded'
  AND a.status IN ('confirmed', 'completed')
ORDER BY a.appointment_date DESC;

-- Problema 3: professional_id inválido
\echo ''
\echo '3️⃣ CITAS CON PROFESSIONAL_ID INVÁLIDO:'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.professional_id as id_invalido,
  a.status
FROM appointments a
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE pa.id IS NULL
ORDER BY a.appointment_date DESC;

-- Resumen
\echo ''
\echo '📊 RESUMEN DE PROBLEMAS:'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  'Sin pago registrado' as tipo_problema,
  COUNT(*) as cantidad
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE p.id IS NULL AND a.status IN ('confirmed', 'completed')

UNION ALL

SELECT 
  'Pago no exitoso' as tipo_problema,
  COUNT(*) as cantidad
FROM appointments a
INNER JOIN payments p ON p.appointment_id = a.id
WHERE p.status != 'succeeded' AND a.status IN ('confirmed', 'completed')

UNION ALL

SELECT 
  'professional_id inválido' as tipo_problema,
  COUNT(*) as cantidad
FROM appointments a
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE pa.id IS NULL;

-- ============================================================================
-- PARTE 2: CORRECCIÓN AUTOMÁTICA (Solo descomentar si quieres ejecutarla)
-- ============================================================================

/*
\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  CORRECCIÓN: Aplicando soluciones'
\echo '═══════════════════════════════════════════════════════════════'

-- Solución 1: Crear pagos faltantes para citas confirmadas
\echo ''
\echo '✅ Creando registros de pago faltantes...'

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

-- Solución 2: Actualizar pagos con estado incorrecto
\echo ''
\echo '✅ Actualizando pagos a estado exitoso...'

UPDATE payments p
SET 
  status = 'succeeded',
  paid_at = COALESCE(paid_at, NOW()),
  updated_at = NOW()
FROM appointments a
WHERE p.appointment_id = a.id
  AND p.status != 'succeeded'
  AND a.status IN ('confirmed', 'completed');

-- Solución 3: Marcar professional_id inválidos (requiere intervención manual)
\echo ''
\echo '⚠️  ADVERTENCIA: Hay citas con professional_id inválido.'
\echo '    Estas requieren corrección manual. Ejecuta:'
\echo ''
\echo '    SELECT * FROM appointments a'
\echo '    LEFT JOIN professional_applications pa ON pa.id = a.professional_id'
\echo '    WHERE pa.id IS NULL;'
\echo ''

\echo ''
\echo '✅ CORRECCIÓN COMPLETADA'
\echo '═══════════════════════════════════════════════════════════════'
*/

-- ============================================================================
-- PARTE 3: VERIFICACIÓN POST-CORRECCIÓN
-- ============================================================================

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  VERIFICACIÓN: Estado actual del sistema'
\echo '═══════════════════════════════════════════════════════════════'

-- Ver todas las citas y su estado
\echo ''
\echo '📋 TODAS LAS CITAS Y SU ESTADO DE PAGO:'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  a.id as cita_id,
  a.appointment_date as fecha,
  a.status as estado_cita,
  pa.first_name || ' ' || pa.last_name as profesional,
  a.cost as costo,
  p.status as estado_pago,
  CASE 
    WHEN pa.id IS NULL THEN '❌ professional_id inválido'
    WHEN p.id IS NULL THEN '⚠️  Sin registro de pago'
    WHEN p.status != 'succeeded' THEN '⚠️  Pago pendiente (' || p.status || ')'
    ELSE '✅ OK'
  END as diagnostico
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
ORDER BY a.appointment_date DESC
LIMIT 50;

-- Contar profesionales afectados
\echo ''
\echo '👥 PROFESIONALES CON PROBLEMAS:'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  pa.first_name || ' ' || pa.last_name as profesional,
  pa.email,
  COUNT(DISTINCT a.id) as citas_con_problemas
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE (p.id IS NULL OR p.status != 'succeeded')
  AND a.status IN ('confirmed', 'completed')
  AND pa.id IS NOT NULL
GROUP BY pa.id, pa.first_name, pa.last_name, pa.email
ORDER BY citas_con_problemas DESC;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  DIAGNÓSTICO COMPLETADO'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'PRÓXIMOS PASOS:'
\echo '1. Revisa los problemas encontrados arriba'
\echo '2. Si quieres aplicar la corrección automática, descomenta la PARTE 2'
\echo '3. Vuelve a ejecutar este script para verificar'
\echo ''

