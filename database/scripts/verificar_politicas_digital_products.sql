-- ============================================================================
-- Script: Verificar políticas de storage para digital-products
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Verificar que las políticas están correctamente configuradas
-- ============================================================================

-- Verificar políticas existentes con sus expresiones
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%digital-products%'
ORDER BY cmd, policyname;

-- Verificar que el bucket existe y está configurado correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'digital-products';

-- ============================================================================
-- VERIFICACIÓN MANUAL
-- ============================================================================
-- Revisa que la política "Authenticated users can upload to digital-products"
-- tenga la expresión WITH CHECK correcta que permita subir sin que el producto exista.
-- 
-- Debe tener algo como:
-- bucket_id = 'digital-products'
-- AND (EXISTS (SELECT 1 FROM professional_applications WHERE ...))
-- ============================================================================
