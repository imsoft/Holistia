-- Agregar columnas de aceptación de términos y privacidad a la tabla professional_applications
ALTER TABLE public.professional_applications 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN NOT NULL DEFAULT false;

-- Comentarios para documentar los campos
COMMENT ON COLUMN professional_applications.terms_accepted IS 'Indica si el profesional aceptó los términos y condiciones';
COMMENT ON COLUMN professional_applications.privacy_accepted IS 'Indica si el profesional aceptó la política de privacidad';

