-- ============================================================================
-- MIGRACIÓN 187: Permitir lectura pública de retos (anon) cuando son públicos
-- ============================================================================
-- Fecha: 2026-01-27
-- Propósito:
--   - Permitir que usuarios NO autenticados (rol anon) puedan ver retos públicos
--     en /explore/challenge/* y listados públicos, siempre que:
--       - challenges.is_active = true
--       - challenges.is_public = true
--   - Mantener protegidos los retos privados (is_public = false)
-- ============================================================================

-- Política para lectura pública (anon) de retos públicos/activos
DROP POLICY IF EXISTS "Anon can view public challenges" ON public.challenges;

CREATE POLICY "Anon can view public challenges"
ON public.challenges
FOR SELECT
TO anon
USING (
  is_active = true
  AND is_public = true
);

COMMENT ON POLICY "Anon can view public challenges" ON public.challenges IS
  'Permite lectura pública (rol anon) de retos activos y públicos (is_public=true).';

