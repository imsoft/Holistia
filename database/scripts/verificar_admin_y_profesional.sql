-- ============================================================================
-- Script: Verificar admin y profesional para diagnosticar error 403
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Verificar que el admin esté activo y el profesional exista
-- ============================================================================

-- PASO 1: Verificar el admin
SELECT 
  id,
  email,
  type,
  account_active,
  created_at
FROM public.profiles
WHERE id = '728d7c6f-b076-43a7-954b-cbfe2f0f794d';

-- PASO 2: Verificar el profesional
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  is_active,
  is_verified
FROM public.professional_applications
WHERE id = 'bd8101ae-2d9e-4cf8-a9a7-927b69e9359c';

-- PASO 3: Probar la expresión de la política manualmente
SELECT 
  'Verificación de admin' as test,
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = '728d7c6f-b076-43a7-954b-cbfe2f0f794d'
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  ) as es_admin_activo;

-- PASO 4: Verificar que el profesional existe y está aprobado
SELECT 
  'Verificación de profesional' as test,
  EXISTS (
    SELECT 1 FROM public.professional_applications
    WHERE id = 'bd8101ae-2d9e-4cf8-a9a7-927b69e9359c'
  ) as profesional_existe;

-- ============================================================================
-- ANÁLISIS
-- ============================================================================
-- Si el PASO 1 muestra account_active = false, ese es el problema.
-- Si el PASO 3 devuelve false, el admin no está correctamente configurado.
-- Si el PASO 4 devuelve false, el profesional no existe.
-- ============================================================================
