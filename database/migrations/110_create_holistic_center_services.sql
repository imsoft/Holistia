-- =====================================================
-- MIGRACIÓN: Crear tabla de servicios de centros holísticos
-- =====================================================
-- Crea la tabla para gestionar los servicios que ofrece
-- cada centro holístico
-- =====================================================

-- 1. Crear tabla de servicios
CREATE TABLE IF NOT EXISTS public.holistic_center_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID NOT NULL REFERENCES public.holistic_centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    service_type TEXT NOT NULL CHECK (service_type IN ('individual', 'group')),
    max_capacity INTEGER, -- Solo para servicios grupales
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: max_capacity debe ser mayor a 0 si es grupal
    CONSTRAINT check_max_capacity
        CHECK (
            (service_type = 'individual' AND max_capacity IS NULL) OR
            (service_type = 'group' AND max_capacity > 0)
        )
);

-- 2. Crear tabla de imágenes de servicios
CREATE TABLE IF NOT EXISTS public.holistic_center_service_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.holistic_center_services(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_order INTEGER NOT NULL DEFAULT 0, -- Para mantener el orden (max 4 imágenes)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: máximo 4 imágenes por servicio
    CONSTRAINT unique_service_order UNIQUE(service_id, image_order),
    CONSTRAINT check_image_order CHECK (image_order >= 0 AND image_order < 4)
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.holistic_center_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holistic_center_service_images ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para servicios
-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on center services"
ON public.holistic_center_services
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver servicios activos
CREATE POLICY "Everyone can view active center services"
ON public.holistic_center_services
FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Políticas RLS para imágenes de servicios
-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on service images"
ON public.holistic_center_service_images
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver imágenes de servicios activos
CREATE POLICY "Everyone can view service images"
ON public.holistic_center_service_images
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.holistic_center_services
        WHERE holistic_center_services.id = service_id
        AND holistic_center_services.is_active = true
    )
);

-- 6. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_center_services_center_id
ON public.holistic_center_services(center_id);

CREATE INDEX IF NOT EXISTS idx_center_services_is_active
ON public.holistic_center_services(is_active);

CREATE INDEX IF NOT EXISTS idx_center_services_type
ON public.holistic_center_services(service_type);

CREATE INDEX IF NOT EXISTS idx_center_service_images_service_id
ON public.holistic_center_service_images(service_id);

-- 7. Triggers para actualizar updated_at automáticamente
CREATE TRIGGER set_center_services_updated_at
    BEFORE UPDATE ON public.holistic_center_services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Comentarios para documentación
COMMENT ON TABLE public.holistic_center_services IS 'Servicios ofrecidos por centros holísticos';
COMMENT ON TABLE public.holistic_center_service_images IS 'Imágenes de los servicios (máximo 4 por servicio)';

COMMENT ON COLUMN public.holistic_center_services.name IS 'Nombre del servicio';
COMMENT ON COLUMN public.holistic_center_services.description IS 'Descripción del servicio';
COMMENT ON COLUMN public.holistic_center_services.price IS 'Precio del servicio';
COMMENT ON COLUMN public.holistic_center_services.service_type IS 'Tipo: individual o group';
COMMENT ON COLUMN public.holistic_center_services.max_capacity IS 'Capacidad máxima (solo para grupales)';
COMMENT ON COLUMN public.holistic_center_services.is_active IS 'Si el servicio está activo';

COMMENT ON COLUMN public.holistic_center_service_images.service_id IS 'ID del servicio';
COMMENT ON COLUMN public.holistic_center_service_images.image_url IS 'URL de la imagen en storage';
COMMENT ON COLUMN public.holistic_center_service_images.image_order IS 'Orden de la imagen (0-3)';

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO EN BUCKET:
-- =====================================================
-- holistic-centers/<center-id>/services/<service-name>/<image-0>.jpg
-- holistic-centers/<center-id>/services/<service-name>/<image-1>.jpg
-- holistic-centers/<center-id>/services/<service-name>/<image-2>.jpg
-- holistic-centers/<center-id>/services/<service-name>/<image-3>.jpg
--
-- Ejemplo:
-- holistic-centers/abc-123/services/yoga-terapeutico/image-0.jpg
-- =====================================================
