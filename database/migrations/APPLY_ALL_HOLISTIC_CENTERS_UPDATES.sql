-- =====================================================
-- SCRIPT CONSOLIDADO: Actualización Completa de Centros Holísticos
-- =====================================================
-- Este script aplica todas las migraciones 108-113 en un solo archivo
-- para facilitar la implementación
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPO CIUDAD
-- =====================================================
ALTER TABLE public.holistic_centers
ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_holistic_centers_city
ON public.holistic_centers(city);

COMMENT ON COLUMN public.holistic_centers.city IS 'Ciudad donde se encuentra el centro holístico';

-- =====================================================
-- 2. CREAR TABLA DE LICENCIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.holistic_center_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID NOT NULL REFERENCES public.holistic_centers(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.holistic_center_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on licenses"
ON public.holistic_center_licenses
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

CREATE INDEX IF NOT EXISTS idx_holistic_center_licenses_center_id
ON public.holistic_center_licenses(center_id);

CREATE INDEX IF NOT EXISTS idx_holistic_center_licenses_created_at
ON public.holistic_center_licenses(created_at DESC);

CREATE TRIGGER set_holistic_center_licenses_updated_at
    BEFORE UPDATE ON public.holistic_center_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.holistic_center_licenses IS 'Licencias y documentos legales de centros holísticos';

-- =====================================================
-- 3. CREAR TABLAS DE SERVICIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.holistic_center_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID NOT NULL REFERENCES public.holistic_centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    service_type TEXT NOT NULL CHECK (service_type IN ('individual', 'group')),
    max_capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_max_capacity
        CHECK (
            (service_type = 'individual' AND max_capacity IS NULL) OR
            (service_type = 'group' AND max_capacity > 0)
        )
);

CREATE TABLE IF NOT EXISTS public.holistic_center_service_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.holistic_center_services(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_service_order UNIQUE(service_id, image_order),
    CONSTRAINT check_image_order CHECK (image_order >= 0 AND image_order < 4)
);

ALTER TABLE public.holistic_center_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holistic_center_service_images ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Everyone can view active center services"
ON public.holistic_center_services
FOR SELECT
TO authenticated
USING (is_active = true);

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

CREATE INDEX IF NOT EXISTS idx_center_services_center_id
ON public.holistic_center_services(center_id);

CREATE INDEX IF NOT EXISTS idx_center_services_is_active
ON public.holistic_center_services(is_active);

CREATE INDEX IF NOT EXISTS idx_center_services_type
ON public.holistic_center_services(service_type);

CREATE INDEX IF NOT EXISTS idx_center_service_images_service_id
ON public.holistic_center_service_images(service_id);

CREATE TRIGGER set_center_services_updated_at
    BEFORE UPDATE ON public.holistic_center_services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.holistic_center_services IS 'Servicios ofrecidos por centros holísticos';
COMMENT ON TABLE public.holistic_center_service_images IS 'Imágenes de los servicios (máximo 4 por servicio)';

-- =====================================================
-- 4. CREAR RELACIÓN CENTROS-PROFESIONALES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.holistic_center_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID NOT NULL REFERENCES public.holistic_centers(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_center_professional UNIQUE(center_id, professional_id)
);

ALTER TABLE public.holistic_center_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on center professionals"
ON public.holistic_center_professionals
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

CREATE POLICY "Professionals can view their centers"
ON public.holistic_center_professionals
FOR SELECT
TO authenticated
USING (
    professional_id IN (
        SELECT id FROM public.professional_applications
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Everyone can view active center professionals"
ON public.holistic_center_professionals
FOR SELECT
TO authenticated
USING (
    is_active = true
    AND EXISTS (
        SELECT 1 FROM public.holistic_centers
        WHERE holistic_centers.id = center_id
        AND holistic_centers.is_active = true
    )
    AND EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE professional_applications.id = professional_id
        AND professional_applications.is_active = true
    )
);

CREATE INDEX IF NOT EXISTS idx_center_professionals_center_id
ON public.holistic_center_professionals(center_id);

CREATE INDEX IF NOT EXISTS idx_center_professionals_professional_id
ON public.holistic_center_professionals(professional_id);

CREATE INDEX IF NOT EXISTS idx_center_professionals_is_active
ON public.holistic_center_professionals(is_active);

CREATE TRIGGER set_center_professionals_updated_at
    BEFORE UPDATE ON public.holistic_center_professionals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.holistic_center_professionals IS 'Relación entre centros holísticos y profesionales que trabajan en ellos';

-- Vista útil
CREATE OR REPLACE VIEW public.center_professionals_view AS
SELECT
    cp.id,
    cp.center_id,
    cp.professional_id,
    cp.is_active,
    cp.created_at,
    hc.name AS center_name,
    hc.city AS center_city,
    CONCAT(pa.first_name, ' ', pa.last_name) AS professional_name,
    pa.profession AS professional_profession,
    pa.wellness_areas AS professional_wellness_areas
FROM public.holistic_center_professionals cp
JOIN public.holistic_centers hc ON hc.id = cp.center_id
JOIN public.professional_applications pa ON pa.id = cp.professional_id
WHERE cp.is_active = true
AND hc.is_active = true
AND pa.status = 'approved';

GRANT SELECT ON public.center_professionals_view TO authenticated;

COMMENT ON VIEW public.center_professionals_view IS 'Vista que combina información de centros y sus profesionales';

-- =====================================================
-- 5. ACTUALIZAR BUCKET PARA SOPORTAR PDFs
-- =====================================================
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  file_size_limit = 10485760
WHERE id = 'holistic-centers';

-- =====================================================
-- 6. PRIVACIDAD DEL TELÉFONO
-- =====================================================
CREATE OR REPLACE VIEW public.holistic_centers_public AS
SELECT
    id,
    name,
    description,
    address,
    city,
    email,
    website,
    instagram,
    image_url,
    opening_hours,
    is_active,
    created_at,
    updated_at
FROM public.holistic_centers
WHERE is_active = true;

CREATE OR REPLACE VIEW public.holistic_centers_admin AS
SELECT
    id,
    name,
    description,
    address,
    city,
    phone,
    email,
    website,
    instagram,
    image_url,
    opening_hours,
    is_active,
    created_at,
    updated_at
FROM public.holistic_centers;

GRANT SELECT ON public.holistic_centers_public TO authenticated;
GRANT SELECT ON public.holistic_centers_admin TO authenticated;

CREATE OR REPLACE FUNCTION get_holistic_centers()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    image_url TEXT,
    opening_hours JSONB,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    ) THEN
        RETURN QUERY
        SELECT * FROM public.holistic_centers_admin;
    ELSE
        RETURN QUERY
        SELECT
            hcp.id,
            hcp.name,
            hcp.description,
            hcp.address,
            hcp.city,
            NULL::TEXT AS phone,
            hcp.email,
            hcp.website,
            hcp.instagram,
            hcp.image_url,
            hcp.opening_hours,
            hcp.is_active,
            hcp.created_at,
            hcp.updated_at
        FROM public.holistic_centers_public hcp;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_holistic_centers() TO authenticated;

COMMENT ON VIEW public.holistic_centers_public IS 'Vista pública de centros holísticos sin teléfono';
COMMENT ON VIEW public.holistic_centers_admin IS 'Vista completa de centros holísticos con teléfono (solo admins)';
COMMENT ON FUNCTION get_holistic_centers() IS 'Función que devuelve centros según el rol del usuario. Admins ven teléfono, otros no.';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- Todas las migraciones se han aplicado exitosamente
-- =====================================================
