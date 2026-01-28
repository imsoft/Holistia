-- ============================================================================
-- MIGRACIÓN 210: Corregir política RLS de challenges para participantes
-- ============================================================================
-- Descripción: Permite que usuarios que participan en un reto puedan verlo
--              incluso si el reto no es activo o no lo crearon
-- Problema: Cuando se hace join desde challenge_purchases, la política RLS
--           de challenges bloquea el acceso si el reto no cumple condiciones
--           (no es activo, no lo creó, etc.)
-- Solución: Agregar condición que permite ver retos si el usuario tiene
--           un challenge_purchase con access_granted = true
-- ============================================================================

-- Eliminar política existente
DROP POLICY IF EXISTS "Users can view their own or linked challenges" ON public.challenges;

-- Crear nueva política que incluye participantes
CREATE POLICY "Users can view their own or linked challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (
  -- Admins pueden ver todos los retos
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND type = 'admin'
    AND account_active = true
  )
  OR
  -- Puede ver si lo creó
  created_by_user_id = auth.uid()
  OR
  -- Puede ver si está vinculado como paciente
  linked_patient_id = auth.uid()
  OR
  -- Puede ver si está vinculado como profesional
  EXISTS (
    SELECT 1 FROM public.professional_applications
    WHERE id = challenges.linked_professional_id
    AND user_id = auth.uid()
  )
  OR
  -- Profesionales pueden ver retos vinculados a sus pacientes
  EXISTS (
    SELECT 1 FROM public.professional_applications pa
    INNER JOIN public.profiles p ON pa.user_id = p.id
    WHERE pa.id = challenges.linked_professional_id
    AND pa.user_id = auth.uid()
    AND challenges.linked_patient_id IN (
      SELECT id FROM auth.users
      WHERE id IN (
        SELECT user_id FROM public.professional_patient_info
        WHERE professional_id = pa.id
      )
    )
  )
  OR
  -- NUEVO: Puede ver si participa en el reto (tiene purchase con access_granted)
  EXISTS (
    SELECT 1 FROM public.challenge_purchases
    WHERE challenge_purchases.challenge_id = challenges.id
    AND challenge_purchases.participant_id = auth.uid()
    AND challenge_purchases.access_granted = true
  )
  OR
  -- Retos activos públicos (para explorar)
  is_active = true
);

-- Comentario
COMMENT ON POLICY "Users can view their own or linked challenges" ON public.challenges IS
  'Permite ver retos si: eres admin, los creaste, están vinculados a ti, participas en ellos, o son activos y públicos';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
