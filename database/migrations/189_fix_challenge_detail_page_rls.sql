-- ============================================================================
-- MIGRACIÓN 189: Arreglar políticas RLS para página de detalle de retos
-- ============================================================================
-- Fecha: 2026-01-27
-- Propósito:
--   - Asegurar que usuarios anon y authenticated puedan ver retos públicos/activos
--   - Permitir que el join con professional_applications funcione correctamente
--   - Consolidar políticas necesarias para /explore/challenge/[slug]
-- ============================================================================

-- ============================================================================
-- 1. POLÍTICA PARA RETOS PÚBLICOS (challenges)
-- ============================================================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Anon can view public challenges" ON public.challenges;

-- Crear política que permite a anon y authenticated ver retos públicos/activos
CREATE POLICY "Anon can view public challenges"
ON public.challenges
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND is_public = true
);

COMMENT ON POLICY "Anon can view public challenges" ON public.challenges IS
  'Permite lectura pública (anon/authenticated) de retos activos y públicos (is_public=true). Necesario para /explore/challenge/[slug].';

-- ============================================================================
-- 2. POLÍTICA PARA PROFESIONALES EN JOINS (professional_applications)
-- ============================================================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Public can view active approved professional applications" ON public.professional_applications;

-- Crear política que permite a anon y authenticated ver profesionales aprobados/activos
CREATE POLICY "Public can view active approved professional applications"
ON public.professional_applications
FOR SELECT
TO anon, authenticated
USING (
  status = 'approved' 
  AND is_active = true
);

COMMENT ON POLICY "Public can view active approved professional applications" ON public.professional_applications IS
  'Permite a usuarios anon y authenticated ver profesionales aprobados y activos. Necesario para joins en páginas públicas como /explore/challenge/[slug].';

-- ============================================================================
-- VERIFICACIÓN: Listar políticas aplicadas
-- ============================================================================

-- Verificar políticas de challenges
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'challenges'
ORDER BY policyname;

-- Verificar políticas de professional_applications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'professional_applications'
ORDER BY policyname;

-- ============================================================================
-- END OF MIGRATION 189
-- ============================================================================
