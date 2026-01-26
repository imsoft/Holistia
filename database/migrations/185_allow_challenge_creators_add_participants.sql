-- ============================================================================
-- MIGRACIÓN 185: Permitir a creadores de retos agregar participantes
-- ============================================================================
-- Fecha: 2026-01-26
-- Propósito:
--   - Agregar política RLS que permita a los creadores de retos (profesionales)
--     agregar pacientes/participantes a sus propios retos
-- ============================================================================

-- Política: Creadores de retos pueden agregar participantes a sus propios retos
CREATE POLICY "Challenge creators can add participants"
ON public.challenge_purchases
FOR INSERT
TO authenticated
WITH CHECK (
  -- El creador del reto puede agregar cualquier participante
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_purchases.challenge_id
    AND c.created_by_user_id = auth.uid()
  )
);

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- PROBLEMA:
-- La política existente "Users can create their own participations" solo permite
-- insertar registros donde participant_id = auth.uid(). Esto impedía que los
-- profesionales pudieran agregar pacientes a sus retos.
--
-- SOLUCIÓN:
-- Esta nueva política permite que los creadores de retos (verificado mediante
-- created_by_user_id) puedan insertar participaciones para cualquier usuario
-- en sus propios retos.
--
-- Las dos políticas de INSERT ahora trabajan juntas:
-- 1. "Users can create their own participations" - permite auto-registro
-- 2. "Challenge creators can add participants" - permite que creadores agreguen otros
-- ============================================================================
