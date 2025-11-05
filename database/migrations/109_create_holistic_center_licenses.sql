-- =====================================================
-- MIGRACIÓN: Crear tabla de licencias para centros holísticos
-- =====================================================
-- Crea la tabla para almacenar licencias de centros holísticos
-- con soporte para múltiples archivos (PDF/imágenes)
-- =====================================================

-- 1. Crear tabla de licencias
CREATE TABLE IF NOT EXISTS public.holistic_center_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID NOT NULL REFERENCES public.holistic_centers(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'image/jpeg', 'image/png', etc.
    file_size INTEGER, -- tamaño en bytes
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.holistic_center_licenses ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS - Solo admins pueden gestionar licencias
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

-- 4. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_holistic_center_licenses_center_id
ON public.holistic_center_licenses(center_id);

CREATE INDEX IF NOT EXISTS idx_holistic_center_licenses_created_at
ON public.holistic_center_licenses(created_at DESC);

-- 5. Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_holistic_center_licenses_updated_at
    BEFORE UPDATE ON public.holistic_center_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Comentarios para documentación
COMMENT ON TABLE public.holistic_center_licenses IS 'Licencias y documentos legales de centros holísticos';
COMMENT ON COLUMN public.holistic_center_licenses.center_id IS 'ID del centro holístico';
COMMENT ON COLUMN public.holistic_center_licenses.file_url IS 'URL del archivo en storage';
COMMENT ON COLUMN public.holistic_center_licenses.file_name IS 'Nombre original del archivo';
COMMENT ON COLUMN public.holistic_center_licenses.file_type IS 'Tipo MIME del archivo';
COMMENT ON COLUMN public.holistic_center_licenses.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN public.holistic_center_licenses.uploaded_by IS 'Usuario que subió el archivo';

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO EN BUCKET:
-- =====================================================
-- holistic-centers/<center-id>/licenses/<license-id>.<ext>
--
-- Ejemplo:
-- holistic-centers/abc-123-def/licenses/xyz-789-ghi.pdf
-- =====================================================
