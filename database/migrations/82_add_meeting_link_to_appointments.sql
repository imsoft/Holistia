-- Migración para agregar campo meeting_link a la tabla appointments
-- Este campo almacenará el enlace de reunión (Zoom, Google Meet, Teams, etc.)
-- para citas online

-- Agregar columna meeting_link
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Agregar comentario explicativo
COMMENT ON COLUMN appointments.meeting_link IS 'Enlace de reunión virtual (Zoom, Google Meet, Teams, etc.) para citas online. Solo visible para el paciente después de que la cita sea confirmada.';

-- Crear índice para consultas frecuentes de citas online con enlace
CREATE INDEX IF NOT EXISTS idx_appointments_online_with_link
ON appointments(appointment_type, meeting_link)
WHERE appointment_type = 'online' AND meeting_link IS NOT NULL;
