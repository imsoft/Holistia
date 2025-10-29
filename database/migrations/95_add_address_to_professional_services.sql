-- Agregar campo address opcional a la tabla professional_services
-- Este campo permitirá que los servicios tengan una dirección específica diferente a la del profesional

ALTER TABLE public.professional_services 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.professional_services.address IS 'Dirección específica del servicio (opcional). Si no se especifica, se usará la dirección del profesional.';

-- Crear índice para consultas eficientes en address
CREATE INDEX IF NOT EXISTS idx_professional_services_address 
ON public.professional_services (address) 
WHERE address IS NOT NULL;

-- No se requieren cambios adicionales en RLS ya que el campo es parte de la misma tabla
