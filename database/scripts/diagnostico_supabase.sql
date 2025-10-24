-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO - VERSIÓN SUPABASE SQL EDITOR
-- ============================================================================
-- Fecha: 24 de octubre de 2025
-- Propósito: Detectar problemas en citas y pagos (compatible con Supabase)
-- ============================================================================

-- ============================================================================
-- PARTE 1: CITAS SIN REGISTRO DE PAGO
-- ============================================================================

SELECT 
  '1️⃣ CITAS SIN REGISTRO DE PAGO' as seccion,
  '' as espacio;

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

-- ============================================================================
-- PARTE 2: PAGOS CON ESTADO INCORRECTO
-- ============================================================================

SELECT 
  '2️⃣ PAGOS CON ESTADO NO EXITOSO' as seccion,
  '' as espacio;

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

-- ============================================================================
-- PARTE 3: PROFESSIONAL_ID INVÁLIDO
-- ============================================================================

SELECT 
  '3️⃣ CITAS CON PROFESSIONAL_ID INVÁLIDO' as seccion,
  '' as espacio;

SELECT 
  a.id as appointment_id,
  a.appointment_date,
  a.professional_id as id_invalido,
  a.status
FROM appointments a
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE pa.id IS NULL
ORDER BY a.appointment_date DESC;

-- ============================================================================
-- PARTE 4: RESUMEN DE PROBLEMAS
-- ============================================================================

SELECT 
  '📊 RESUMEN DE PROBLEMAS' as seccion,
  '' as espacio;

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
-- PARTE 5: TODAS LAS CITAS Y SU ESTADO
-- ============================================================================

SELECT 
  '📋 TODAS LAS CITAS Y SU ESTADO DE PAGO (últimas 50)' as seccion,
  '' as espacio;

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

-- ============================================================================
-- PARTE 6: PROFESIONALES AFECTADOS
-- ============================================================================

SELECT 
  '👥 PROFESIONALES CON PROBLEMAS' as seccion,
  '' as espacio;

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

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================
-- Si encontraste problemas, ejecuta el script de corrección:
-- database/scripts/correccion_automatica.sql
-- ============================================================================

