-- ============================================================================
-- Script: Diagnosticar error 403 al crear productos digitales desde admin
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Identificar por qué los admins no pueden crear productos digitales
-- ============================================================================

-- PASO 1: Verificar que el admin existe y está activo
SELECT 
  id,
  email,
  type,
  account_active,
  created_at
FROM public.profiles
WHERE id = '728d7c6f-b076-43a7-954b-cbfe2f0f794d';

-- PASO 2: Verificar políticas de digital_products para admins
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'digital_products'
  AND policyname LIKE '%admin%'
ORDER BY cmd;

-- PASO 3: Verificar que el profesional existe
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  status,
  is_active
FROM public.professional_applications
WHERE id = 'bd8101ae-2d9e-4cf8-a9a7-927b69e9359c';

-- PASO 4: Probar la expresión de la política manualmente
-- Esto debería devolver al menos una fila si el admin está correctamente configurado
SELECT 
  'Admin check' as test,
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = '728d7c6f-b076-43a7-954b-cbfe2f0f794d'
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  ) as is_admin_active;

-- PASO 5: Verificar todas las políticas de digital_products
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN qual IS NULL THEN '❌ Sin USING'
    ELSE '✅ Con USING'
  END as using_status,
  CASE 
    WHEN with_check IS NULL THEN '❌ Sin WITH CHECK'
    ELSE '✅ Con WITH CHECK'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'digital_products'
ORDER BY cmd, policyname;

-- ============================================================================
-- ANÁLISIS
-- ============================================================================
-- Si el PASO 1 muestra account_active = false, ese es el problema.
-- Si el PASO 2 no muestra políticas con WITH CHECK, necesitas ejecutar migración 157.
-- Si el PASO 4 devuelve false, el admin no está correctamente configurado.
-- ============================================================================
