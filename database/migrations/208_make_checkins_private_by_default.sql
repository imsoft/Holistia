-- ============================================================================
-- MIGRACIÓN 208: Hacer que los check-ins sean privados por defecto
-- ============================================================================
-- Problema: Los check-ins se crean como públicos por defecto (is_public = true)
-- Solución: Cambiar el valor por defecto a false para que sean privados hasta
-- que el usuario decida publicarlos explícitamente
-- ============================================================================

-- Cambiar el valor por defecto de is_public a false
ALTER TABLE public.challenge_checkins
  ALTER COLUMN is_public SET DEFAULT false;

-- Actualizar check-ins existentes que no tienen evidencia a privados
-- (solo los que tienen evidencia_url pueden ser públicos)
UPDATE public.challenge_checkins
SET is_public = false
WHERE evidence_url IS NULL OR evidence_url = '';

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON COLUMN public.challenge_checkins.is_public IS 
'Indica si el check-in es público (visible en el feed social). Por defecto false (privado)';
