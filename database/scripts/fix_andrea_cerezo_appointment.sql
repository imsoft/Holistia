-- ============================================================================
-- Script para corregir cita de Andrea Cerezo con professional_id incorrecto
-- ============================================================================
-- Fecha: 24 de octubre de 2025
-- Problema: La cita del 22 de octubre tiene user_id en lugar de professional_id
-- Esto causa que no aparezca en el listado del profesional
-- ============================================================================

-- ANTES DE EJECUTAR: Verificar los datos actuales
SELECT 
  id as appointment_id,
  professional_id as professional_id_actual,
  appointment_date,
  appointment_time,
  status,
  cost,
  notes
FROM appointments
WHERE id = '863d9ef3-7a11-4151-95cb-215c61df025d';

-- Verificar que el professional_id correcto existe
SELECT 
  id as professional_id_correcto,
  first_name,
  last_name,
  email,
  profession,
  user_id
FROM professional_applications
WHERE user_id = 'c47f5a3e-1050-4276-aee7-2a2f3e7c8fea';

-- ============================================================================
-- CORRECCIÓN: Actualizar el professional_id al valor correcto
-- ============================================================================

UPDATE appointments
SET 
  professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2', -- ID correcto de Andrea Cerezo
  updated_at = NOW()
WHERE id = '863d9ef3-7a11-4151-95cb-215c61df025d';

-- ============================================================================
-- VERIFICACIÓN: Confirmar que se corrigió
-- ============================================================================

SELECT 
  a.id as appointment_id,
  a.professional_id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  pa.first_name,
  pa.last_name,
  pa.email,
  'CORREGIDO ✅' as resultado
FROM appointments a
LEFT JOIN professional_applications pa ON pa.id = a.professional_id
WHERE a.id = '863d9ef3-7a11-4151-95cb-215c61df025d';

-- ============================================================================
-- RESULTADO ESPERADO:
-- Deberías ver:
-- - professional_id: 441c1fd3-87c5-4248-a502-381e8e7aacc2
-- - first_name: Andrea 
-- - last_name: Cerezo 
-- - email: andycerezo2492@gmail.com
-- - resultado: CORREGIDO ✅
-- ============================================================================

