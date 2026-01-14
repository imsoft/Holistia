-- ============================================================================
-- SCRIPT DE VERIFICACIÓN: Acceso completo de administradores
-- ============================================================================
-- Fecha: 2026-01-13
-- Propósito: Verificar que los administradores tengan acceso completo a TODAS
--            las tablas y storage buckets relacionados con profesionales
--
-- NOTA: Este script es compatible con Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICAR POLÍTICAS RLS EN TABLAS
-- ============================================================================

-- 1. professional_applications
SELECT
  '📋 TABLA: professional_applications' as seccion,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'professional_applications'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

-- 2. professional_services
SELECT
  '📋 TABLA: professional_services' as seccion,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'professional_services'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

-- 3. digital_products
SELECT
  '📋 TABLA: digital_products' as seccion,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'digital_products'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

-- 4. challenges
SELECT
  '📋 TABLA: challenges' as seccion,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'challenges'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

-- 5. events_workshops
SELECT
  '📋 TABLA: events_workshops' as seccion,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'events_workshops'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

-- 6. appointments
SELECT
  '📋 TABLA: appointments' as seccion,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'appointments'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

-- ============================================================================
-- PARTE 2: VERIFICAR POLÍTICAS DE STORAGE
-- ============================================================================

-- Buckets relacionados con profesionales
SELECT
  '🗄️ STORAGE BUCKETS' as seccion,
  CASE
    WHEN (SELECT string_agg(DISTINCT (regexp_match(policyname, 'avatars?'))[1], ',') FROM pg_policies WHERE schemaname = 'storage' AND policyname ILIKE '%avatar%') IS NOT NULL
    THEN 'avatars'
    ELSE NULL
  END as bucket,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%admin%'
  AND policyname ILIKE '%avatar%'
ORDER BY cmd;

SELECT
  '🗄️ STORAGE BUCKETS' as seccion,
  'professional-services' as bucket,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%admin%'
  AND policyname ILIKE '%service%'
ORDER BY cmd;

SELECT
  '🗄️ STORAGE BUCKETS' as seccion,
  'professional-gallery' as bucket,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Sí'
    ELSE '❌ No'
  END as tiene_with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%admin%'
  AND policyname ILIKE '%gallery%'
ORDER BY cmd;

-- ============================================================================
-- PARTE 3: RESUMEN GENERAL
-- ============================================================================

-- Contar políticas de admin en tablas
SELECT
  '📊 RESUMEN' as tipo,
  'Políticas admin en TABLAS' as categoria,
  COUNT(*) as total
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname ILIKE '%admin%'
  AND tablename IN (
    'professional_applications',
    'professional_services',
    'digital_products',
    'challenges',
    'events_workshops',
    'appointments'
  );

-- Contar políticas de admin en storage
SELECT
  '📊 RESUMEN' as tipo,
  'Políticas admin en STORAGE' as categoria,
  COUNT(*) as total
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%admin%';

-- ============================================================================
-- PARTE 4: VERIFICAR SI FALTAN POLÍTICAS CRÍTICAS
-- ============================================================================

-- Verificar avatars
SELECT
  '⚠️ VERIFICACIÓN CRÍTICA' as tipo,
  'Bucket: avatars' as recurso,
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ Configurado correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Revisa la guía'
  END as estado,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%avatar%'
  AND policyname ILIKE '%admin%';

-- Verificar professional-gallery
SELECT
  '⚠️ VERIFICACIÓN CRÍTICA' as tipo,
  'Bucket: professional-gallery' as recurso,
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ Configurado correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Revisa la guía'
  END as estado,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%gallery%'
  AND policyname ILIKE '%admin%';

-- Verificar professional-services
SELECT
  '⚠️ VERIFICACIÓN CRÍTICA' as tipo,
  'Bucket: professional-services' as recurso,
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ Configurado correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Revisa la guía'
  END as estado,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%service%'
  AND policyname ILIKE '%admin%';

-- Verificar professional_applications
SELECT
  '⚠️ VERIFICACIÓN CRÍTICA' as tipo,
  'Tabla: professional_applications' as recurso,
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ Configurado correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Ejecuta migración 81'
  END as estado,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'professional_applications'
  AND policyname ILIKE '%admin%';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

SELECT '✅ VERIFICACIÓN COMPLETADA' as mensaje,
       'Si ves ❌, sigue la guía en: database/scripts/GUIA_COMPLETA_ADMIN_ACCESO_TOTAL.md' as siguiente_paso;
