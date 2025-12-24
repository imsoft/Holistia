-- ============================================================================
-- MIGRACIÓN 147: Agregar acceso público a professional_applications
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Permitir que usuarios no autenticados vean profesionales aprobados
--             en páginas públicas como /specialties/[slug]
-- ============================================================================

-- Eliminar política si existe (para evitar errores en re-ejecución)
DROP POLICY IF EXISTS "Public can view active approved professional applications" ON public.professional_applications;

-- Crear política para acceso público (anon) a profesionales aprobados y activos
CREATE POLICY "Public can view active approved professional applications"
ON public.professional_applications
FOR SELECT
TO anon
USING (
  status = 'approved' 
  AND is_active = true
);

-- Comentario
COMMENT ON POLICY "Public can view active approved professional applications" ON public.professional_applications
IS 'Permite a usuarios no autenticados ver profesionales aprobados y activos en páginas públicas como especialidades';
