-- DIAGNÓSTICO FINAL: Nombres de Pacientes
-- Verificar si el problema persiste después de las correcciones

-- 1. VERIFICAR DATOS EN PROFILES
SELECT 
  '📊 DATOS EN PROFILES' as seccion,
  COUNT(*) as total_pacientes,
  COUNT(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 END) as con_nombre,
  COUNT(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 END) as con_apellido,
  COUNT(CASE WHEN first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '' THEN 1 END) as nombre_completo
FROM public.profiles 
WHERE type = 'patient' AND account_active = true;

-- 2. VERIFICAR CITAS CON NOMBRES
SELECT 
  '🔍 CITAS CON NOMBRES' as seccion,
  a.id as appointment_id,
  a.patient_id,
  a.professional_id,
  a.appointment_date,
  CONCAT(p.first_name, ' ', p.last_name) as nombre_completo,
  p.email,
  p.phone
FROM public.appointments a
LEFT JOIN public.profiles p ON a.patient_id = p.id
WHERE a.appointment_date >= '2025-10-01'
  AND p.type = 'patient'
  AND p.account_active = true
ORDER BY a.appointment_date DESC
LIMIT 5;

-- 3. VERIFICAR PROFESIONALES Y SUS PACIENTES
SELECT 
  '👨‍⚕️ PROFESIONALES Y PACIENTES' as seccion,
  pa.user_id as professional_user_id,
  pa.id as professional_application_id,
  pa.status as professional_status,
  COUNT(DISTINCT a.patient_id) as total_pacientes_unicos,
  STRING_AGG(DISTINCT CONCAT(p.first_name, ' ', p.last_name), ', ') as nombres_pacientes
FROM public.professional_applications pa
LEFT JOIN public.appointments a ON pa.id = a.professional_id
LEFT JOIN public.profiles p ON a.patient_id = p.id
WHERE pa.status = 'approved'
  AND a.appointment_date >= '2025-10-01'
  AND p.type = 'patient'
  AND p.account_active = true
GROUP BY pa.user_id, pa.id, pa.status
ORDER BY total_pacientes_unicos DESC;

-- 4. VERIFICAR SI HAY PROBLEMAS DE RLS
SELECT 
  '🔐 VERIFICAR RLS' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'appointments', 'professional_applications')
ORDER BY tablename, policyname;

-- 5. VERIFICAR PERMISOS EN PROFILES
SELECT 
  '🔑 PERMISOS PROFILES' as seccion,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;
