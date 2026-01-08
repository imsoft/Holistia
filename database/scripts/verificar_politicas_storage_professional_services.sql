-- ============================================================================
-- Script: Verificar Políticas de Storage para Professional Services
-- ============================================================================
-- Este script solo LEE las políticas existentes, no las modifica
-- No requiere permisos especiales
-- ============================================================================

-- Verificar políticas existentes en el bucket professional-services
SELECT 
  policyname as "Nombre de Política",
  cmd as "Operación",
  roles::text as "Roles",
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Tiene USING'
    ELSE '❌ Sin USING'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Tiene WITH CHECK'
    ELSE '❌ Sin WITH CHECK'
  END as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%service%' 
    OR policyname LIKE '%professional%'
    OR qual::text LIKE '%professional-services%'
    OR with_check::text LIKE '%professional-services%'
  )
ORDER BY policyname;

-- Verificar todas las políticas del bucket (si hay alguna que no tenga "service" en el nombre)
SELECT 
  policyname as "Nombre de Política",
  cmd as "Operación",
  roles::text as "Roles"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%professional-services%'
    OR with_check::text LIKE '%professional-services%'
  )
ORDER BY policyname;

-- ============================================================================
-- POLÍTICAS NECESARIAS:
-- ============================================================================
-- 
-- 1. "Public can view service images" (SELECT, public)
-- 2. "Professionals can upload service images" (INSERT, authenticated)
-- 3. "Admins can upload service images" (INSERT, authenticated)
-- 4. "Professionals can update service images" (UPDATE, authenticated)
-- 5. "Admins can update service images" (UPDATE, authenticated)
-- 6. "Professionals can delete service images" (DELETE, authenticated)
-- 7. "Admins can delete service images" (DELETE, authenticated)
--
-- Si faltan algunas, créalas desde el Dashboard siguiendo las instrucciones
-- en: database/scripts/crear_storage_policies_professional_services.md
-- ============================================================================
