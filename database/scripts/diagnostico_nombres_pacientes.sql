-- ============================================================================
-- Script para diagnosticar el problema de nombres de pacientes
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Verificar por qué los nombres siguen apareciendo como "Paciente d89373fe"
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar datos en la tabla profiles
-- ============================================================================

SELECT 
  '👤 DATOS EN TABLA PROFILES' as seccion,
  id,
  first_name,
  last_name,
  email,
  type,
  account_active
FROM profiles
WHERE id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937';

-- ============================================================================
-- PASO 2: Verificar datos en la vista professional_patient_info
-- ============================================================================

SELECT 
  '🔍 DATOS EN VISTA PROFESSIONAL_PATIENT_INFO' as seccion,
  patient_id,
  full_name,
  email,
  phone,
  professional_id
FROM professional_patient_info
WHERE patient_id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937';

-- ============================================================================
-- PASO 3: Verificar citas del profesional
-- ============================================================================

SELECT 
  '📅 CITAS DEL PROFESIONAL' as seccion,
  a.id as appointment_id,
  a.patient_id,
  a.professional_id,
  a.appointment_date,
  pa.first_name as professional_name,
  p.first_name as patient_name,
  p.last_name as patient_last_name
FROM appointments a
INNER JOIN professional_applications pa ON pa.id = a.professional_id
INNER JOIN profiles p ON p.id = a.patient_id
WHERE a.professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2'
ORDER BY a.appointment_date DESC;

-- ============================================================================
-- PASO 4: Verificar si hay problemas con la vista
-- ============================================================================

SELECT 
  '🧪 PRUEBA DE LA VISTA' as seccion,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as con_nombre,
  COUNT(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 END) as sin_nombre
FROM professional_patient_info
WHERE professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2';

-- ============================================================================
-- PASO 5: Verificar datos específicos del paciente
-- ============================================================================

SELECT 
  '🔍 DATOS ESPECÍFICOS DEL PACIENTE' as seccion,
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  CONCAT(p.first_name, ' ', p.last_name) as nombre_completo,
  ppi.full_name as nombre_en_vista
FROM profiles p
LEFT JOIN professional_patient_info ppi ON ppi.patient_id = p.id
WHERE p.id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937';

-- ============================================================================
-- DIAGNÓSTICO AUTOMÁTICO
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM professional_patient_info 
      WHERE patient_id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937'
      AND full_name IS NOT NULL 
      AND full_name != ''
    ) THEN '✅ Vista tiene datos correctos'
    ELSE '❌ Vista no tiene datos o están vacíos'
  END as estado_vista;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937'
      AND first_name IS NOT NULL 
      AND first_name != ''
    ) THEN '✅ Tabla profiles tiene datos correctos'
    ELSE '❌ Tabla profiles no tiene datos o están vacíos'
  END as estado_profiles;

-- ============================================================================
-- INSTRUCCIONES DE SOLUCIÓN
-- ============================================================================

SELECT 
  '🔧 POSIBLES SOLUCIONES' as instrucciones,
  '1. Limpiar caché del navegador (Ctrl+F5 o Cmd+Shift+R)' as paso_1,
  '2. Verificar que el código se desplegó correctamente' as paso_2,
  '3. Verificar que no hay errores en la consola del navegador' as paso_3,
  '4. Verificar que la vista professional_patient_info tiene datos' as paso_4;
