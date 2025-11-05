-- =====================================================
-- MIGRACIÓN: Crear relación entre centros y profesionales
-- =====================================================
-- Crea la tabla de relación muchos a muchos entre
-- centros holísticos y profesionales
-- =====================================================

-- 1. Crear tabla de relación
CREATE TABLE IF NOT EXISTS public.holistic_center_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID NOT NULL REFERENCES public.holistic_centers(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: no duplicar la relación
    CONSTRAINT unique_center_professional UNIQUE(center_id, professional_id)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.holistic_center_professionals ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
-- Los administradores pueden hacer todo
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

-- Los profesionales pueden ver en qué centros trabajan
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

-- Todos pueden ver relaciones activas (para páginas públicas)
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

-- 4. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_center_professionals_center_id
ON public.holistic_center_professionals(center_id);

CREATE INDEX IF NOT EXISTS idx_center_professionals_professional_id
ON public.holistic_center_professionals(professional_id);

CREATE INDEX IF NOT EXISTS idx_center_professionals_is_active
ON public.holistic_center_professionals(is_active);

-- 5. Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_center_professionals_updated_at
    BEFORE UPDATE ON public.holistic_center_professionals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Comentarios para documentación
COMMENT ON TABLE public.holistic_center_professionals IS 'Relación entre centros holísticos y profesionales que trabajan en ellos';
COMMENT ON COLUMN public.holistic_center_professionals.center_id IS 'ID del centro holístico';
COMMENT ON COLUMN public.holistic_center_professionals.professional_id IS 'ID del profesional';
COMMENT ON COLUMN public.holistic_center_professionals.is_active IS 'Si la relación está activa';

-- =====================================================
-- VISTA ÚTIL PARA CONSULTAS
-- =====================================================
-- Vista que combina información de centros y profesionales
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

-- Permitir acceso a la vista para usuarios autenticados
GRANT SELECT ON public.center_professionals_view TO authenticated;

COMMENT ON VIEW public.center_professionals_view IS 'Vista que combina información de centros y sus profesionales';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
