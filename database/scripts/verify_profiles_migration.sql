-- ============================================================================
-- SCRIPT DE VERIFICACIÓN: Migración a public.profiles
-- ============================================================================
-- Ejecutar DESPUÉS de aplicar la migración 61_create_profiles_table.sql
-- Este script verifica que todo se haya creado correctamente
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLA
-- ============================================================================

SELECT '🏗️  ESTRUCTURA DE TABLA' as seccion, '' as detalle;

SELECT 
  'Columnas de profiles' as verificacion,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
GROUP BY table_name;

-- ============================================================================
-- 2. VERIFICAR ÍNDICES
-- ============================================================================

SELECT '📑 ÍNDICES CREADOS' as seccion, '' as detalle;

SELECT 
  indexname as indice,
  indexdef as definicion
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY indexname;

-- ============================================================================
-- 3. VERIFICAR RLS HABILITADO
-- ============================================================================

SELECT '🔒 ROW LEVEL SECURITY' as seccion, '' as detalle;

SELECT 
  tablename as tabla,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Deshabilitado'
  END as estado
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================================================

SELECT '📋 POLÍTICAS RLS' as seccion, '' as detalle;

SELECT 
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Con condición USING'
    ELSE '⚠️  Sin condición USING'
  END as tiene_using,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Con condición WITH CHECK'
    ELSE '⚠️  Sin condición WITH CHECK'
  END as tiene_with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '⚡ TRIGGERS ACTIVOS' as seccion, '' as detalle;

SELECT 
  trigger_name as trigger,
  event_manipulation as evento,
  action_timing as momento,
  action_statement as accion
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'profiles'
ORDER BY trigger_name;

-- Verificar trigger en auth.users
SELECT 
  trigger_name as trigger,
  event_manipulation as evento,
  'auth.users' as tabla,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ Correcto'
    ELSE '⚠️  Revisar'
  END as estado
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%auth_user%'
ORDER BY trigger_name;

-- ============================================================================
-- 6. VERIFICAR DATOS MIGRADOS
-- ============================================================================

SELECT '📊 MIGRACIÓN DE DATOS' as seccion, '' as detalle;

-- Conteo total
SELECT 
  'Total en auth.users' as metrica,
  COUNT(*)::text as valor
FROM auth.users

UNION ALL

SELECT 
  'Total en profiles',
  COUNT(*)::text
FROM public.profiles

UNION ALL

-- Usuarios sin profile (debe ser 0)
SELECT 
  'Usuarios sin profile (debe ser 0)',
  COUNT(*)::text
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL

UNION ALL

-- Profiles sin usuario (debe ser 0)
SELECT 
  'Profiles sin usuario (debe ser 0)',
  COUNT(*)::text
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;

-- ============================================================================
-- 7. VERIFICAR DISTRIBUCIÓN POR TIPO
-- ============================================================================

SELECT '👥 DISTRIBUCIÓN POR TIPO' as seccion, '' as detalle;

SELECT 
  COALESCE(type, 'NULL') as tipo,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2)::text || '%' as porcentaje
FROM public.profiles
GROUP BY type
ORDER BY cantidad DESC;

-- ============================================================================
-- 8. VERIFICAR INTEGRIDAD DE DATOS
-- ============================================================================

SELECT '✅ INTEGRIDAD DE DATOS' as seccion, '' as detalle;

-- Emails coinciden
SELECT 
  'Emails que coinciden' as verificacion,
  COUNT(*) FILTER (WHERE u.email = p.email)::text as correctos,
  COUNT(*) FILTER (WHERE u.email != p.email)::text as incorrectos
FROM auth.users u
JOIN public.profiles p ON p.id = u.id;

-- Fechas de creación coinciden
SELECT 
  'Fechas de creación coinciden' as verificacion,
  COUNT(*) FILTER (WHERE DATE(u.created_at) = DATE(p.created_at))::text as correctos,
  COUNT(*) FILTER (WHERE DATE(u.created_at) != DATE(p.created_at))::text as incorrectos
FROM auth.users u
JOIN public.profiles p ON p.id = u.id;

-- ============================================================================
-- 9. COMPARAR DATOS: user_metadata vs profiles
-- ============================================================================

SELECT '🔍 COMPARACIÓN DE DATOS' as seccion, '' as detalle;

SELECT 
  'Registros con first_name en metadata' as fuente,
  COUNT(*) FILTER (WHERE u.raw_user_meta_data->>'first_name' IS NOT NULL AND u.raw_user_meta_data->>'first_name' != '')::text as cantidad
FROM auth.users u

UNION ALL

SELECT 
  'Registros con first_name en profiles',
  COUNT(*) FILTER (WHERE p.first_name IS NOT NULL AND p.first_name != '')::text
FROM public.profiles p

UNION ALL

SELECT 
  'Registros con phone en metadata',
  COUNT(*) FILTER (WHERE u.raw_user_meta_data->>'phone' IS NOT NULL AND u.raw_user_meta_data->>'phone' != '')::text
FROM auth.users u

UNION ALL

SELECT 
  'Registros con phone en profiles',
  COUNT(*) FILTER (WHERE p.phone IS NOT NULL AND p.phone != '')::text
FROM public.profiles p

UNION ALL

SELECT 
  'Registros con type en metadata',
  COUNT(*) FILTER (WHERE u.raw_user_meta_data->>'type' IS NOT NULL)::text
FROM auth.users u

UNION ALL

SELECT 
  'Registros con type en profiles',
  COUNT(*) FILTER (WHERE p.type IS NOT NULL)::text
FROM public.profiles p;

-- ============================================================================
-- 10. MUESTRA DE DATOS (primeros 5)
-- ============================================================================

SELECT '📋 MUESTRA DE DATOS (primeros 5)' as seccion, '' as detalle;

SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.type,
  p.phone,
  p.created_at::date as fecha_creacion
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================================================
-- 11. TEST DE PERFORMANCE
-- ============================================================================

SELECT '⚡ PERFORMANCE TEST' as seccion, '' as detalle;

-- Query con profiles (debería ser más rápida)
EXPLAIN ANALYZE
SELECT 
  pa.id,
  pa.first_name,
  pa.last_name,
  p.type as user_type,
  p.email
FROM professional_applications pa
LEFT JOIN public.profiles p ON p.id = pa.user_id
WHERE p.type = 'admin'
LIMIT 10;

-- ============================================================================
-- 12. RESUMEN FINAL
-- ============================================================================

SELECT '🎯 RESUMEN FINAL' as seccion, '' as detalle;

WITH stats AS (
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL) as sin_profile,
    (SELECT COUNT(policyname) FROM pg_policies WHERE tablename = 'profiles') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'profiles') as total_indexes
)
SELECT 
  CASE 
    WHEN total_users = total_profiles AND sin_profile = 0 AND total_policies >= 5 AND total_indexes >= 4
    THEN '✅ MIGRACIÓN EXITOSA - TODO OK'
    ELSE '⚠️  REVISAR - Hay inconsistencias'
  END as estado,
  total_users as usuarios,
  total_profiles as profiles,
  sin_profile as sin_profile,
  total_policies as politicas,
  total_indexes as indices
FROM stats;

-- ============================================================================
-- FIN DEL SCRIPT DE VERIFICACIÓN
-- ============================================================================

