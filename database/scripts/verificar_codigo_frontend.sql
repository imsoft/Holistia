-- VERIFICAR QUE EL CÓDIGO FRONTEND ESTÉ FUNCIONANDO
-- Simular la consulta que hace el frontend

-- 1. SIMULAR CONSULTA DEL FRONTEND PARA PACIENTES
SELECT 
  '🎯 SIMULACIÓN FRONTEND' as seccion,
  'Consulta profiles' as paso,
  COUNT(*) as total_registros,
  STRING_AGG(CONCAT(id, ':', first_name, ' ', last_name), ', ') as nombres_encontrados
FROM public.profiles 
WHERE type = 'patient' 
  AND account_active = true
  AND id IN (
    'd89373fe-4cf4-4401-a466-0c1efe9a5937',
    'db19210a-7e8a-4a52-a1da-150aa7eef6ab'
  );

-- 2. VERIFICAR QUE LOS DATOS ESTÁN DISPONIBLES
SELECT 
  '✅ DATOS DISPONIBLES' as seccion,
  id,
  first_name,
  last_name,
  email,
  phone,
  CONCAT(first_name, ' ', last_name) as nombre_completo
FROM public.profiles 
WHERE type = 'patient' 
  AND account_active = true
  AND id IN (
    'd89373fe-4cf4-4401-a466-0c1efe9a5937',
    'db19210a-7e8a-4a52-a1da-150aa7eef6ab'
  )
ORDER BY first_name;

-- 3. VERIFICAR CITAS ASOCIADAS
SELECT 
  '📅 CITAS ASOCIADAS' as seccion,
  a.patient_id,
  CONCAT(p.first_name, ' ', p.last_name) as nombre_paciente,
  a.appointment_date,
  a.professional_id
FROM public.appointments a
JOIN public.profiles p ON a.patient_id = p.id
WHERE a.patient_id IN (
    'd89373fe-4cf4-4401-a466-0c1efe9a5937',
    'db19210a-7e8a-4a52-a1da-150aa7eef6ab'
  )
  AND p.type = 'patient'
  AND p.account_active = true
ORDER BY a.appointment_date DESC;
