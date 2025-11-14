-- Agregar campo image_url a la tabla professional_services
-- Cada servicio puede tener una imagen asociada

-- Agregar columna image_url
ALTER TABLE public.professional_services 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.professional_services.image_url IS 'URL de la imagen del servicio (almacenada en Supabase Storage)';

-- Crear índice para mejorar consultas (opcional)
CREATE INDEX IF NOT EXISTS idx_professional_services_image_url 
ON public.professional_services (image_url) 
WHERE image_url IS NOT NULL;

