-- ============================================================================
-- MIGRACIÓN 188: Extender acceso público a professional_applications para authenticated
-- ============================================================================
-- Fecha: 2026-01-27
-- Propósito:
--   - Extender la política existente de professional_applications para que usuarios
--     autenticados (authenticated) también puedan leer profesionales aprobados/activos.
--   - Esto es necesario para que el join en /explore/challenge/[slug] funcione
--     tanto para usuarios anon como authenticated.
-- ============================================================================

-- Actualizar política existente para incluir authenticated
DROP POLICY IF EXISTS "Public can view active approved professional applications" ON public.professional_applications;

CREATE POLICY "Public can view active approved professional applications"
ON public.professional_applications
FOR SELECT
TO anon, authenticated
USING (
  status = 'approved' 
  AND is_active = true
);

COMMENT ON POLICY "Public can view active approved professional applications" ON public.professional_applications IS
  'Permite a usuarios anon y authenticated ver profesionales aprobados y activos en páginas públicas como especialidades y detalles de retos.';
