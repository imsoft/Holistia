-- Migración 212: Agregar campo attended a event_registrations para marcar asistencia
-- Este campo permite a los administradores marcar si una persona asistió o no al evento

-- Agregar columna attended (boolean, nullable para registros antiguos)
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT NULL;

-- Agregar comentario
COMMENT ON COLUMN public.event_registrations.attended IS 'Indica si la persona asistió al evento. NULL = no marcado, TRUE = asistió, FALSE = no asistió';

-- Crear índice para búsquedas rápidas por asistencia
CREATE INDEX IF NOT EXISTS idx_event_registrations_attended ON public.event_registrations(attended) WHERE attended IS NOT NULL;
