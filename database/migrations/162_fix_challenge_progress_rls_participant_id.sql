-- ============================================================================
-- MIGRACIÓN 162: Corregir política RLS de challenge_progress para usar participant_id
-- ============================================================================
-- Problema: La política RLS de challenge_progress usa buyer_id que fue renombrado
-- a participant_id en la migración 149.
-- ============================================================================

-- Eliminar política existente que usa buyer_id
DROP POLICY IF EXISTS "Users can view their own progress" ON public.challenge_progress;

-- Crear nueva política usando participant_id
CREATE POLICY "Users can view their own progress"
ON public.challenge_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_progress.challenge_purchase_id
        AND challenge_purchases.participant_id = auth.uid()
    )
);

-- También necesitamos políticas para INSERT y UPDATE
DROP POLICY IF EXISTS "Users can create their own progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.challenge_progress;

-- Política para INSERT: usuarios pueden crear progreso para sus propias compras
CREATE POLICY "Users can create their own progress"
ON public.challenge_progress
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_progress.challenge_purchase_id
        AND challenge_purchases.participant_id = auth.uid()
    )
);

-- Política para UPDATE: usuarios pueden actualizar su propio progreso
CREATE POLICY "Users can update their own progress"
ON public.challenge_progress
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_progress.challenge_purchase_id
        AND challenge_purchases.participant_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_progress.challenge_purchase_id
        AND challenge_purchases.participant_id = auth.uid()
    )
);
