-- ============================================================================
-- MIGRACIÓN 159: Asegurar acceso completo de admins a todos los recursos de profesionales
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Garantizar que los admins puedan gestionar TODO relacionado con profesionales:
--            - professional_applications (ya corregido en 158)
--            - digital_products (ya corregido en 157)
--            - professional_services (verificar)
--            - challenges (verificar)
--            - Storage buckets (profiles, professional-gallery, etc.)
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR Y CORREGIR professional_services
-- ============================================================================

-- Verificar política actual
SELECT 
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'professional_services'
  AND policyname LIKE '%admin%';

-- La política ya debería estar correcta según migración 154, pero verificamos

-- ============================================================================
-- 2. VERIFICAR Y CORREGIR challenges
-- ============================================================================

-- Verificar política actual
SELECT 
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'challenges'
  AND policyname LIKE '%admin%';

-- La política ya debería estar correcta según migración 150, pero verificamos

-- ============================================================================
-- RESUMEN DE VERIFICACIONES
-- ============================================================================
-- Esta migración solo verifica. Las correcciones se hicieron en:
-- - 157: digital_products
-- - 158: professional_applications
-- - 154: professional_services
-- - 150: challenges
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- Para storage buckets, las políticas deben crearse manualmente desde el Dashboard
-- porque requieren permisos de superusuario. Ver:
-- - database/scripts/LEER_PRIMERO_politicas_digital_products.md
-- - database/scripts/LEER_PRIMERO_politicas_storage.md
-- - database/scripts/agregar_politicas_admin_storage_professional_services.md
-- ============================================================================
