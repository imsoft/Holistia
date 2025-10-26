-- Fix: Permitir que profesionales vean datos de sus pacientes
-- Problema: Políticas RLS bloquean acceso a datos de pacientes

-- 1. Crear política específica para profesionales
CREATE POLICY "Professionals can view their patients"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    type = 'patient' 
    AND account_active = true
    AND EXISTS (
      SELECT 1
      FROM public.professional_applications pa
      JOIN public.appointments a ON pa.id = a.professional_id
      WHERE pa.user_id = auth.uid()
        AND pa.status = 'approved'
        AND a.patient_id = profiles.id
    )
  );

-- 2. Verificar que la política se creó correctamente
SELECT 
  '✅ POLÍTICA CREADA' as seccion,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname = 'Professionals can view their patients';
