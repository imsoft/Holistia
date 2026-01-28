-- ============================================================================
-- MIGRACIÓN 211: Corregir política RLS de challenge_checkins para usar participant_id
-- ============================================================================
-- Descripción: Las políticas RLS de challenge_checkins usan buyer_id que fue
--              renombrado a participant_id en la migración 149. Esto causa
--              que las queries se queden colgadas o fallen.
-- Problema: Las políticas están usando una columna que no existe (buyer_id)
-- Solución: Actualizar todas las políticas para usar participant_id
-- ============================================================================

-- Eliminar políticas existentes que usan buyer_id
DROP POLICY IF EXISTS "Users can view their own checkins" ON public.challenge_checkins;
DROP POLICY IF EXISTS "Users can create their own checkins" ON public.challenge_checkins;
DROP POLICY IF EXISTS "Professionals can view checkins of their challenges" ON public.challenge_checkins;
DROP POLICY IF EXISTS "Professionals can verify checkins" ON public.challenge_checkins;

-- Política: Usuarios pueden ver sus propios check-ins
CREATE POLICY "Users can view their own checkins"
ON public.challenge_checkins
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_checkins.challenge_purchase_id
        AND challenge_purchases.participant_id = auth.uid()
        AND challenge_purchases.access_granted = true
    )
);

-- Política: Usuarios pueden crear sus propios check-ins
CREATE POLICY "Users can create their own checkins"
ON public.challenge_checkins
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_checkins.challenge_purchase_id
        AND challenge_purchases.participant_id = auth.uid()
        AND challenge_purchases.access_granted = true
    )
);

-- Política: Profesionales pueden ver check-ins de sus retos
CREATE POLICY "Professionals can view checkins of their challenges"
ON public.challenge_checkins
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON cp.challenge_id = c.id
        WHERE cp.id = challenge_checkins.challenge_purchase_id
        AND (
            c.created_by_user_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM public.professional_applications pa
                WHERE pa.id = c.linked_professional_id
                AND pa.user_id = auth.uid()
            )
        )
    )
);

-- Política: Profesionales pueden verificar check-ins
CREATE POLICY "Professionals can verify checkins"
ON public.challenge_checkins
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON cp.challenge_id = c.id
        WHERE cp.id = challenge_checkins.challenge_purchase_id
        AND (
            c.created_by_user_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM public.professional_applications pa
                WHERE pa.id = c.linked_professional_id
                AND pa.user_id = auth.uid()
            )
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON cp.challenge_id = c.id
        WHERE cp.id = challenge_checkins.challenge_purchase_id
        AND (
            c.created_by_user_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM public.professional_applications pa
                WHERE pa.id = c.linked_professional_id
                AND pa.user_id = auth.uid()
            )
        )
    )
);

-- Comentarios
COMMENT ON POLICY "Users can view their own checkins" ON public.challenge_checkins IS
  'Permite a usuarios ver sus propios check-ins si tienen access_granted en el purchase';
COMMENT ON POLICY "Users can create their own checkins" ON public.challenge_checkins IS
  'Permite a usuarios crear check-ins si tienen access_granted en el purchase';
COMMENT ON POLICY "Professionals can view checkins of their challenges" ON public.challenge_checkins IS
  'Permite a profesionales ver check-ins de retos que crearon o están vinculados';
COMMENT ON POLICY "Professionals can verify checkins" ON public.challenge_checkins IS
  'Permite a profesionales verificar check-ins de retos que crearon o están vinculados';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
