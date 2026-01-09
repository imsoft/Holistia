-- ============================================================================
-- MIGRACIÓN 164: Corregir recursión infinita en política RLS de challenge_teams
-- ============================================================================
-- Problema: La política "Users can view teams they are part of" tiene
-- recursión infinita porque consulta challenge_team_members dentro de la misma
-- política que está verificando challenge_teams, y challenge_team_members
-- también consulta challenge_teams.
-- ============================================================================

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Users can view teams they are part of" ON public.challenge_teams;

-- Crear nueva política sin recursión
-- La nueva política verifica directamente sin consultar challenge_team_members
CREATE POLICY "Users can view teams they are part of"
ON public.challenge_teams
FOR SELECT
TO authenticated
USING (
    -- El usuario puede ver si es el creador del equipo
    auth.uid() = creator_id
    OR
    -- O si tiene un purchase del reto asociado (sin consultar challenge_team_members)
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_id = challenge_teams.challenge_id
        AND participant_id = auth.uid()
    )
);
