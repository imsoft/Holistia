-- =====================================================
-- SCRIPT DE VERIFICACIÓN Y DIAGNÓSTICO
-- Storage para Restaurantes y Centros Holísticos
-- =====================================================
-- Este script verifica si los buckets existen y las
-- políticas están correctamente configuradas
-- =====================================================

-- 1. Verificar si los buckets existen
SELECT 
  'Buckets existentes' as check_type,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('restaurants', 'holistic-centers')
ORDER BY id;

-- 2. Verificar políticas RLS para restaurants
SELECT 
  'Políticas para restaurants' as check_type,
  policyname,
  cmd as operation,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%restaurant%'
ORDER BY policyname;

-- 3. Verificar políticas RLS para holistic-centers
SELECT 
  'Políticas para holistic-centers' as check_type,
  policyname,
  cmd as operation,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%holistic%'
ORDER BY policyname;

-- 4. Verificar que RLS está habilitado en storage.objects
SELECT 
  'RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- =====================================================
-- SI LOS BUCKETS NO EXISTEN, EJECUTA:
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'restaurants',
--   'restaurants',
--   true,
--   5242880, -- 5MB
--   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
-- )
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'holistic-centers',
--   'holistic-centers',
--   true,
--   5242880, -- 5MB
--   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SI LAS POLÍTICAS NO EXISTEN, EJECUTA LA MIGRACIÓN:
-- =====================================================
-- database/migrations/102_create_storage_buckets.sql
