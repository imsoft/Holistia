-- ============================================================================
-- MIGRACIÓN 186: Permitir eliminar participantes de retos
-- ============================================================================
-- Fecha: 2026-01-26
-- Propósito:
--   - Permitir que el creador del reto pueda eliminar participaciones (challenge_purchases)
--   - Permitir que admins (account_active) puedan eliminar participaciones
-- ============================================================================

DROP POLICY IF EXISTS "Challenge creators can remove participants" ON public.challenge_purchases;

CREATE POLICY "Challenge creators can remove participants"
ON public.challenge_purchases
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_purchases.challenge_id
    AND c.created_by_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.type = 'admin'
    AND p.account_active = true
  )
);

