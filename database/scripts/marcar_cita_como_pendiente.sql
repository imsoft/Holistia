-- ============================================================================
-- SCRIPT: Marcar cita como pendiente (no confirmada por profesional)
-- ============================================================================
-- Cita: 27 de octubre de 2025, 10:00 - Justo Javier Torres Rios
-- Profesional: Andrea Cerezo
-- ============================================================================

-- Cambiar el status de "confirmed" a "pending"
UPDATE appointments
SET 
  status = 'pending',
  updated_at = NOW()
WHERE appointment_date = '2025-10-27'
  AND appointment_time = '10:00:00'
  AND professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2';

-- Verificar el cambio
SELECT 
  id,
  appointment_date,
  appointment_time,
  status,
  '✅ Ahora aparecerá como Pendiente' as resultado
FROM appointments
WHERE appointment_date = '2025-10-27'
  AND appointment_time = '10:00:00'
  AND professional_id = '441c1fd3-87c5-4248-a502-381e8e7aacc2';

