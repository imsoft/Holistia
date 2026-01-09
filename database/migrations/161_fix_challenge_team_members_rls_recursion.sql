-- ============================================================================
-- MIGRACIÓN 161: Corregir recursión infinita en política RLS de challenge_team_members
-- ============================================================================
-- Problema: La política "Users can view team members of their teams" tiene
-- recursión infinita porque consulta challenge_team_members dentro de la misma
-- política que está verificando challenge_team_members.
-- ============================================================================

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.challenge_team_members;

-- Crear nueva política sin recursión
-- La nueva política verifica directamente challenge_teams sin consultar challenge_team_members
CREATE POLICY "Users can view team members of their teams"
ON public.challenge_team_members
FOR SELECT
TO authenticated
USING (
    -- El usuario puede ver si es miembro del equipo (user_id = auth.uid())
    user_id = auth.uid()
    OR
    -- O si es el creador del equipo (sin consultar challenge_team_members)
    EXISTS (
        SELECT 1 FROM public.challenge_teams
        WHERE id = challenge_team_members.team_id
        AND creator_id = auth.uid()
    )
);
