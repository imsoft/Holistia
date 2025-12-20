-- Migración 137: Permitir acceso público a las imágenes de servicios holísticos
-- La página /companies es pública, por lo que necesitamos permitir acceso anónimo

-- 1. Eliminar la política restrictiva existente
DROP POLICY IF EXISTS "Everyone can view holistic service images" ON public.holistic_service_images;

-- 2. Crear nueva política que permite acceso anónimo (público)
CREATE POLICY "Public can view active holistic service images"
ON public.holistic_service_images
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.holistic_services
        WHERE holistic_services.id = service_id
        AND holistic_services.is_active = true
    )
);

-- Comentario
COMMENT ON POLICY "Public can view active holistic service images" ON public.holistic_service_images IS
'Permite acceso público (anónimo y autenticado) a las imágenes de servicios holísticos activos para la landing page de empresas';
