-- Agregar campo de posición de imagen de portada en retos
-- Permite al creador ajustar qué parte de la imagen se muestra (focal point)
-- El valor es un CSS object-position válido, ej: '50% 50%', '30% 20%'
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS cover_image_position TEXT DEFAULT '50% 50%';
