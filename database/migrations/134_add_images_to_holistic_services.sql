-- Migración 134: Agregar soporte de imágenes a servicios holísticos
-- Permite que los servicios holísticos tengan múltiples imágenes

-- 1. Crear tabla de imágenes de servicios holísticos
CREATE TABLE IF NOT EXISTS public.holistic_service_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.holistic_services(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: máximo 4 imágenes por servicio
    CONSTRAINT unique_service_order UNIQUE(service_id, image_order),
    CONSTRAINT check_image_order CHECK (image_order >= 0 AND image_order < 4)
);

-- 2. Habilitar RLS
ALTER TABLE public.holistic_service_images ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para imágenes
-- Eliminar políticas existentes si existen (para hacer la migración idempotente)
DROP POLICY IF EXISTS "Admins can do everything on holistic service images" ON public.holistic_service_images;
DROP POLICY IF EXISTS "Everyone can view holistic service images" ON public.holistic_service_images;

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on holistic service images"
ON public.holistic_service_images
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver imágenes de servicios activos (público)
CREATE POLICY "Everyone can view holistic service images"
ON public.holistic_service_images
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.holistic_services
        WHERE holistic_services.id = service_id
        AND holistic_services.is_active = true
    )
);

-- 4. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_holistic_service_images_service_id 
ON public.holistic_service_images(service_id);

CREATE INDEX IF NOT EXISTS idx_holistic_service_images_order 
ON public.holistic_service_images(service_id, image_order);

-- 5. Comentarios
COMMENT ON TABLE public.holistic_service_images IS 'Imágenes de servicios holísticos (máximo 4 por servicio)';
COMMENT ON COLUMN public.holistic_service_images.service_id IS 'ID del servicio holístico';
COMMENT ON COLUMN public.holistic_service_images.image_url IS 'URL de la imagen en storage';
COMMENT ON COLUMN public.holistic_service_images.image_order IS 'Orden de la imagen (0-3)';

-- 6. Crear bucket de storage si no existe (holistic-services)
-- Nota: Esto debe ejecutarse manualmente en Supabase Dashboard si el bucket no existe
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'holistic-services',
--   'holistic-services',
--   true,
--   5242880, -- 5MB
--   ARRAY['image/jpeg', 'image/png', 'image/webp']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Estructura de almacenamiento en bucket:
-- holistic-services/<service-id>/image-0.jpg
-- holistic-services/<service-id>/image-1.jpg
-- holistic-services/<service-id>/image-2.jpg
-- holistic-services/<service-id>/image-3.jpg
