-- ============================================================================
-- MIGRACIÓN 156: SOLO VERIFICACIÓN - Políticas deben crearse desde Dashboard
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Este script SOLO verifica el bucket, NO crea políticas
--            Las políticas deben crearse manualmente desde el Dashboard
--            Ver: database/scripts/LEER_PRIMERO_politicas_digital_products.md
-- ============================================================================

-- Verificar que el bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'digital-products';

-- Verificar políticas existentes (solo lectura, no modifica)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%digital-products%'
ORDER BY policyname;

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
-- Este script SOLO verifica el estado del bucket y las políticas.
-- Para crear las políticas, sigue las instrucciones en:
-- database/scripts/LEER_PRIMERO_politicas_digital_products.md
-- ============================================================================
