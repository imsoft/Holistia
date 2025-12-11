-- ============================================================================
-- MIGRACIÓN: Agregar acceso público a servicios profesionales
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Permitir que usuarios no autenticados vean servicios en perfiles públicos
-- ============================================================================

-- Crear política para acceso público (anon) a servicios activos
CREATE POLICY IF NOT EXISTS "Public can view active professional services"
ON public.professional_services
FOR SELECT
TO anon
USING (
  isactive = true AND
  EXISTS (
    SELECT 1 FROM public.professional_applications pa
    WHERE pa.id = professional_services.professional_id
    AND pa.status = 'approved'
    AND pa.is_active = true
  )
);

-- Comentario
COMMENT ON POLICY "Public can view active professional services" ON public.professional_services
IS 'Permite a usuarios no autenticados ver servicios activos de profesionales aprobados en perfiles públicos';
