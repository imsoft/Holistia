-- ============================================================================
-- MIGRACIÓN 171: Agregar campo para razón de reprogramación
-- ============================================================================
-- Descripción: Agrega campo opcional para almacenar la razón de reprogramación
-- ============================================================================

-- Agregar campo para razón de reprogramación (opcional)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;

-- Agregar comentario
COMMENT ON COLUMN appointments.reschedule_reason IS
'Razón opcional proporcionada al reprogramar la cita';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
