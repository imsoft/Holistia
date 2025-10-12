-- Agregar campo de Instagram a professional_applications
-- Los usuarios pueden ingresar su cuenta de Instagram para mostrar en su perfil

ALTER TABLE public.professional_applications 
ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);

-- Comentario para documentar el campo
COMMENT ON COLUMN professional_applications.instagram IS 'Usuario de Instagram del profesional (sin @ ni https://)';

-- Nota: El campo es opcional, no se requiere NOT NULL

