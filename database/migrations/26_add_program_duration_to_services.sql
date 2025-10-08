-- Agregar campo program_duration a la tabla professional_services
-- Este campo almacenará la duración de programas/paquetes como JSONB

ALTER TABLE public.professional_services 
ADD COLUMN program_duration JSONB;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.professional_services.program_duration IS 'Duración del programa/paquete en formato JSONB: {"value": number, "unit": "meses|semanas|dias|horas"}';

-- Crear índice para consultas eficientes en program_duration
CREATE INDEX IF NOT EXISTS idx_professional_services_program_duration 
ON public.professional_services USING GIN (program_duration);

-- Actualizar RLS policies si es necesario (las existentes deberían seguir funcionando)
-- No se requieren cambios adicionales en RLS ya que el campo es parte de la misma tabla
