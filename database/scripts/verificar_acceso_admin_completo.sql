-- ============================================================================
-- SCRIPT DE VERIFICACIÓN: Acceso completo de administradores
-- ============================================================================
-- Fecha: 2026-01-13
-- Propósito: Verificar que los administradores tengan acceso completo a TODAS
--            las tablas y storage buckets relacionados con profesionales
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICAR POLÍTICAS RLS EN TABLAS
-- ============================================================================

\echo '🔍 VERIFICANDO POLÍTICAS RLS EN TABLAS...'
\echo ''

-- 1. professional_applications
\echo '📋 Tabla: professional_applications'
SELECT
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'professional_applications'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

\echo ''

-- 2. professional_services
\echo '📋 Tabla: professional_services'
SELECT
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'professional_services'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

\echo ''

-- 3. digital_products
\echo '📋 Tabla: digital_products'
SELECT
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'digital_products'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

\echo ''

-- 4. challenges
\echo '📋 Tabla: challenges'
SELECT
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'challenges'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

\echo ''

-- 5. events_workshops
\echo '📋 Tabla: events_workshops'
SELECT
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'events_workshops'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

\echo ''

-- 6. appointments
\echo '📋 Tabla: appointments'
SELECT
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_with_check
FROM pg_policies
WHERE tablename = 'appointments'
  AND schemaname = 'public'
  AND policyname ILIKE '%admin%'
ORDER BY cmd;

\echo ''

-- ============================================================================
-- PARTE 2: VERIFICAR POLÍTICAS DE STORAGE
-- ============================================================================

\echo '🗄️  VERIFICANDO POLÍTICAS DE STORAGE...'
\echo ''

-- Buckets relacionados con profesionales
SELECT
  CASE
    WHEN bucket_id = 'avatars' THEN '📸 avatars'
    WHEN bucket_id = 'professional-gallery' THEN '🖼️  professional-gallery'
    WHEN bucket_id = 'professional-services' THEN '💼 professional-services'
    WHEN bucket_id = 'digital-products' THEN '📦 digital-products'
    WHEN bucket_id = 'challenges' THEN '🏆 challenges'
    ELSE bucket_id
  END as bucket,
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%admin%'
  AND (
    policyname ILIKE '%avatar%'
    OR policyname ILIKE '%professional%'
    OR policyname ILIKE '%digital%'
    OR policyname ILIKE '%challenge%'
  )
ORDER BY bucket_id, cmd;

\echo ''

-- ============================================================================
-- PARTE 3: RESUMEN GENERAL
-- ============================================================================

\echo '📊 RESUMEN GENERAL'
\echo ''

-- Contar políticas de admin en tablas
\echo '🔢 Total de políticas de admin en tablas:'
SELECT COUNT(*) as total_politicas_tablas
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

\echo ''

-- Contar políticas de admin en storage
\echo '🔢 Total de políticas de admin en storage:'
SELECT COUNT(*) as total_politicas_storage
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%admin%';

\echo ''

-- ============================================================================
-- PARTE 4: VERIFICAR SI FALTAN POLÍTICAS CRÍTICAS
-- ============================================================================

\echo '⚠️  VERIFICACIÓN DE POLÍTICAS CRÍTICAS'
\echo ''

-- Verificar avatars
\echo '🔍 Bucket avatars:'
SELECT
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ Políticas configuradas correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Revisa la guía'
  END as estado
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%avatar%'
  AND policyname ILIKE '%admin%';

\echo ''

-- Verificar professional-gallery
\echo '🔍 Bucket professional-gallery:'
SELECT
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ Políticas configuradas correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Revisa la guía'
  END as estado
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%gallery%'
  AND policyname ILIKE '%admin%';

\echo ''

-- Verificar professional-services
\echo '🔍 Bucket professional-services:'
SELECT
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ Políticas configuradas correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Revisa la guía'
  END as estado
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%service%'
  AND policyname ILIKE '%admin%';

\echo ''

-- Verificar professional_applications
\echo '🔍 Tabla professional_applications:'
SELECT
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ Políticas configuradas correctamente'
    ELSE '❌ FALTAN POLÍTICAS - Ejecuta migración 81'
  END as estado
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'professional_applications'
  AND policyname ILIKE '%admin%';

\echo ''

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

\echo '✅ Verificación completada'
\echo ''
\echo '📝 SIGUIENTE PASO:'
\echo '   Si ves ❌ en alguna sección, sigue la guía en:'
\echo '   database/scripts/GUIA_COMPLETA_ADMIN_ACCESO_TOTAL.md'
\echo ''
