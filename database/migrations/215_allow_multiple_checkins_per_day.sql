-- ============================================================================
-- MIGRACIÓN 215: Permitir múltiples check-ins por día
-- ============================================================================
-- Antes: UNIQUE (challenge_purchase_id, day_number) - solo un check-in por día.
-- Ahora: permitir varias publicaciones del mismo día.
-- ============================================================================

ALTER TABLE public.challenge_checkins
  DROP CONSTRAINT IF EXISTS challenge_checkins_unique_day;
