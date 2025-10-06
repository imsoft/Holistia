-- Agregar campos para horarios de trabajo del profesional
ALTER TABLE professional_applications 
ADD COLUMN working_start_time TIME DEFAULT '09:00',
ADD COLUMN working_end_time TIME DEFAULT '18:00',
ADD COLUMN working_days INTEGER[] DEFAULT '{1,2,3,4,5}';

-- Crear índices para optimizar consultas por horarios
CREATE INDEX IF NOT EXISTS idx_professional_applications_working_hours 
ON professional_applications (working_start_time, working_end_time);

-- Comentarios para documentar los campos
COMMENT ON COLUMN professional_applications.working_start_time IS 'Hora de inicio de la jornada laboral del profesional';
COMMENT ON COLUMN professional_applications.working_end_time IS 'Hora de fin de la jornada laboral del profesional';
COMMENT ON COLUMN professional_applications.working_days IS 'Días de la semana que trabaja el profesional (1=Lunes, 2=Martes, ..., 7=Domingo)';
