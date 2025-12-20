-- Migración 138: Asegurar acceso público a la tabla holistic_services
-- La página /companies es pública, por lo que necesitamos permitir acceso anónimo

-- 1. Verificar si la tabla existe, si no, crearla
CREATE TABLE IF NOT EXISTS public.holistic_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT benefits_is_array CHECK (jsonb_typeof(benefits) = 'array')
);

-- 2. Habilitar RLS
ALTER TABLE public.holistic_services ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admins can do everything on holistic_services" ON public.holistic_services;
DROP POLICY IF EXISTS "Everyone can view active holistic_services" ON public.holistic_services;
DROP POLICY IF EXISTS "Public can view active holistic_services" ON public.holistic_services;

-- 4. Crear políticas

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on holistic_services"
ON public.holistic_services
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Acceso público (anónimo y autenticado) para servicios activos
CREATE POLICY "Public can view active holistic_services"
ON public.holistic_services
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_holistic_services_is_active ON public.holistic_services(is_active);
CREATE INDEX IF NOT EXISTS idx_holistic_services_name ON public.holistic_services(name);

-- 6. Trigger para updated_at (si no existe la función, crearla)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y recrearlo
DROP TRIGGER IF EXISTS set_holistic_services_updated_at ON public.holistic_services;

CREATE TRIGGER set_holistic_services_updated_at
    BEFORE UPDATE ON public.holistic_services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Comentarios
COMMENT ON TABLE public.holistic_services IS 'Servicios holísticos ofrecidos para empresas';
COMMENT ON COLUMN public.holistic_services.name IS 'Nombre del servicio';
COMMENT ON COLUMN public.holistic_services.description IS 'Descripción del servicio';
COMMENT ON COLUMN public.holistic_services.benefits IS 'Lista de beneficios del servicio en formato JSON array';
COMMENT ON COLUMN public.holistic_services.is_active IS 'Si el servicio está activo y visible en la landing page';
