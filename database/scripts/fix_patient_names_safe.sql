-- SCRIPT SEGURO: Solucionar nombres de pacientes sin recursión
-- Ejecutar después de restaurar RLS básico

-- 1. CREAR POLÍTICA ESPECÍFICA PARA PROFESIONALES VER SUS PACIENTES
-- Esta política NO usa funciones complejas que puedan causar recursión
CREATE POLICY "professionals_view_patients_safe"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    type = 'patient' 
    AND account_active = true
    AND EXISTS (
      SELECT 1
      FROM public.appointments a
      JOIN public.professional_applications pa ON a.professional_id = pa.id
      WHERE pa.user_id = auth.uid()
        AND pa.status = 'approved'
        AND a.patient_id = profiles.id
    )
  );

-- 2. VERIFICAR QUE LA POLÍTICA SE CREÓ
SELECT 
  '✅ POLÍTICA PROFESIONALES' as seccion,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname = 'professionals_view_patients_safe';

-- 3. PROBAR CONSULTA QUE HACE EL FRONTEND
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

-- 4. VERIFICAR TODAS LAS POLÍTICAS
SELECT 
  '📋 TODAS LAS POLÍTICAS' as seccion,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
