-- Permitir a los participantes actualizar su propia fila en challenge_purchases
-- Necesario para que puedan guardar sus días de compromiso (schedule_days)
CREATE POLICY "Participants can update their own purchases"
ON public.challenge_purchases
FOR UPDATE
TO authenticated
USING (participant_id = auth.uid())
WITH CHECK (participant_id = auth.uid());

-- Permitir a los creadores del reto y admins actualizar purchases
-- (necesario para que el profesional pueda asignar schedule_days al agregar pacientes)
CREATE POLICY "Challenge creators and admins can update purchases"
ON public.challenge_purchases
FOR UPDATE
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
