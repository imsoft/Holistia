-- ============================================================================
-- Script: Verificar permisos completos de admins para gestionar profesionales
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Verificar que los admins tengan acceso completo a todas las tablas
--            y buckets relacionados con profesionales
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR POLÍTICAS DE TABLAS
-- ============================================================================

-- professional_applications
SELECT 
  'professional_applications' as tabla,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'professional_applications'
  AND policyname LIKE '%admin%'
ORDER BY cmd, policyname;

-- digital_products
SELECT 
  'digital_products' as tabla,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'digital_products'
  AND policyname LIKE '%admin%'
ORDER BY cmd, policyname;

-- professional_services
SELECT 
  'professional_services' as tabla,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'professional_services'
  AND policyname LIKE '%admin%'
ORDER BY cmd, policyname;

-- challenges
SELECT 
  'challenges' as tabla,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'challenges'
  AND policyname LIKE '%admin%'
ORDER BY cmd, policyname;

-- ============================================================================
-- 2. VERIFICAR POLÍTICAS DE STORAGE
-- ============================================================================

-- professional-services bucket
SELECT 
  'professional-services' as bucket,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%admin%professional-services%'
ORDER BY cmd, policyname;

-- digital-products bucket
SELECT 
  'digital-products' as bucket,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%admin%digital-products%'
ORDER BY cmd, policyname;

-- professional-gallery bucket
SELECT 
  'professional-gallery' as bucket,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%admin%professional-gallery%'
ORDER BY cmd, policyname;

-- profiles bucket (para profile_photo)
SELECT 
  'profiles' as bucket,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%admin%profiles%'
ORDER BY cmd, policyname;

-- ============================================================================
-- RESUMEN
-- ============================================================================
-- Verifica que cada tabla tenga políticas de admins con:
-- - cmd = 'ALL' o al menos SELECT, INSERT, UPDATE, DELETE
-- - has_using = true (para SELECT, UPDATE, DELETE)
-- - has_with_check = true (para INSERT, UPDATE)
-- ============================================================================
