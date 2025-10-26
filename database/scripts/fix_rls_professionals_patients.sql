-- SCRIPT PARA EJECUTAR EN SUPABASE DASHBOARD
-- Problema: Políticas RLS bloquean acceso a datos de pacientes

-- 1. Verificar políticas actuales
SELECT 
  '🔍 POLÍTICAS ACTUALES' as seccion,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Crear política específica para profesionales
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

-- 3. Verificar que la política se creó
SELECT 
  '✅ POLÍTICA CREADA' as seccion,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname = 'Professionals can view their patients';

-- 4. Probar la consulta que hace el frontend
SELECT 
  '🧪 PRUEBA CONSULTA FRONTEND' as seccion,
  id,
  first_name,
  last_name,
  email,
  phone
FROM public.profiles 
WHERE type = 'patient' 
  AND account_active = true
  AND id IN (
    'd89373fe-4cf4-4401-a466-0c1efe9a5937',
    'db19210a-7e8a-4a52-a1da-150aa7eef6ab'
  )
ORDER BY first_name;
