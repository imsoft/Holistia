-- ============================================================================
-- Script: Diagnóstico completo del error 403 al crear productos digitales
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Verificar todos los aspectos que podrían causar el error 403
-- ============================================================================

-- PASO 1: Verificar el admin
SELECT 
  'Admin' as tipo,
  id,
  email,
  type,
  account_active,
  CASE 
    WHEN type = 'admin' AND account_active = true THEN '✅ Admin activo'
    WHEN type = 'admin' AND account_active = false THEN '❌ Admin inactivo'
    WHEN type != 'admin' THEN '❌ No es admin'
    ELSE '⚠️ Estado desconocido'
  END as estado
FROM public.profiles
WHERE id = '728d7c6f-b076-43a7-954b-cbfe2f0f794d';

-- PASO 2: Verificar el profesional
SELECT 
  'Profesional' as tipo,
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  is_active,
  is_verified,
  CASE 
    WHEN status = 'approved' AND is_active = true THEN '✅ Aprobado y activo'
    WHEN status = 'approved' AND is_active = false THEN '⚠️ Aprobado pero inactivo'
    WHEN status != 'approved' THEN '❌ No aprobado'
    ELSE '⚠️ Estado desconocido'
  END as estado
FROM public.professional_applications
WHERE id = 'bd8101ae-2d9e-4cf8-a9a7-927b69e9359c';

-- PASO 3: Probar la expresión de la política de admins
SELECT 
  'Test política admin' as test,
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = '728d7c6f-b076-43a7-954b-cbfe2f0f794d'
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  ) as deberia_permitir_insert;

-- PASO 4: Verificar constraints de la tabla digital_products
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.digital_products'::regclass
ORDER BY contype, conname;

-- PASO 5: Intentar simular el INSERT (solo verificar, no insertar)
-- Esto nos dirá si hay algún problema con los datos
SELECT 
  'bd8101ae-2d9e-4cf8-a9a7-927b69e9359c'::uuid as professional_id,
  'Test Product' as title,
  'Test Description' as description,
  'guide' as category,
  100.00 as price,
  'MXN' as currency,
  true as is_active,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.professional_applications
      WHERE id = 'bd8101ae-2d9e-4cf8-a9a7-927b69e9359c'::uuid
    ) THEN '✅ Profesional existe'
    ELSE '❌ Profesional NO existe'
  END as profesional_valido;

-- ============================================================================
-- ANÁLISIS
-- ============================================================================
-- Si el PASO 1 muestra "Admin inactivo", actualiza account_active = true
-- Si el PASO 2 muestra "No aprobado", ese es el problema
-- Si el PASO 3 devuelve false, la política no funcionará
-- Si el PASO 5 muestra "Profesional NO existe", ese es el problema
-- ============================================================================
