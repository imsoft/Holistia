-- ============================================================================
-- SCRIPT DE VERIFICACIÓN: Migración RLS a profiles
-- ============================================================================
-- Ejecutar DESPUÉS de aplicar 62_update_all_rls_to_use_profiles.sql
-- Verifica que todas las políticas usen profiles correctamente
-- ============================================================================

-- ============================================================================
-- 1. RESUMEN GENERAL
-- ============================================================================

SELECT '📊 RESUMEN GENERAL' as seccion, '' as detalle;

SELECT 
  'Total de políticas RLS' as metrica,
  COUNT(*)::text as valor
FROM pg_policies

UNION ALL

SELECT 
  'Políticas que usan profiles.type',
  COUNT(*)::text
FROM pg_policies
WHERE qual::text LIKE '%profiles.type%' 
   OR with_check::text LIKE '%profiles.type%'

UNION ALL

SELECT 
  '⚠️  Políticas que AÚN usan auth.users.raw_user_meta_data',
  COUNT(*)::text
FROM pg_policies
WHERE (qual::text LIKE '%raw_user_meta_data%')
   OR (with_check::text LIKE '%raw_user_meta_data%');

-- ============================================================================
-- 2. POLÍTICAS POR TABLA
-- ============================================================================

SELECT '📋 POLÍTICAS POR TABLA' as seccion, '' as detalle;

SELECT 
  tablename as tabla,
  COUNT(*) as total_politicas,
  COUNT(*) FILTER (WHERE qual::text LIKE '%profiles.type%' OR with_check::text LIKE '%profiles.type%') as usa_profiles,
  COUNT(*) FILTER (WHERE qual::text LIKE '%raw_user_meta_data%' OR with_check::text LIKE '%raw_user_meta_data%') as usa_user_metadata
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_politicas DESC;

-- ============================================================================
-- 3. DETALLE: Políticas de payments
-- ============================================================================

SELECT '💰 DETALLE: payments' as seccion, '' as detalle;

SELECT 
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%profiles%' THEN '✅ Usa profiles'
    WHEN qual::text LIKE '%raw_user_meta_data%' THEN '⚠️  Usa user_metadata'
    ELSE '❓ Revisar'
  END as estado
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;

-- ============================================================================
-- 4. DETALLE: Políticas de appointments
-- ============================================================================

SELECT '📅 DETALLE: appointments' as seccion, '' as detalle;

SELECT 
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%profiles%' THEN '✅ Usa profiles'
    WHEN qual::text LIKE '%raw_user_meta_data%' THEN '⚠️  Usa user_metadata'
    ELSE '❓ Revisar'
  END as estado
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- ============================================================================
-- 5. DETALLE: Políticas de events_workshops
-- ============================================================================

SELECT '🎪 DETALLE: events_workshops' as seccion, '' as detalle;

SELECT 
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%profiles%' THEN '✅ Usa profiles'
    WHEN qual::text LIKE '%raw_user_meta_data%' THEN '⚠️  Usa user_metadata'
    ELSE '❓ Revisar'
  END as estado
FROM pg_policies
WHERE tablename = 'events_workshops'
ORDER BY policyname;

-- ============================================================================
-- 6. DETALLE: Políticas de professional_applications
-- ============================================================================

SELECT '👨‍⚕️ DETALLE: professional_applications' as seccion, '' as detalle;

SELECT 
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%profiles%' THEN '✅ Usa profiles'
    WHEN qual::text LIKE '%raw_user_meta_data%' THEN '⚠️  Usa user_metadata'
    ELSE '❓ Revisar'
  END as estado
FROM pg_policies
WHERE tablename = 'professional_applications'
ORDER BY policyname;

-- ============================================================================
-- 7. TEST DE PERFORMANCE: Antes vs Después
-- ============================================================================

SELECT '⚡ TEST DE PERFORMANCE' as seccion, '' as detalle;

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
-- 8. TEST FUNCIONAL: Acceso como Admin
-- ============================================================================

SELECT '🧪 TEST FUNCIONAL' as seccion, '' as detalle;

-- Ver tu propio perfil
SELECT 
  'Tu perfil' as test,
  id,
  email,
  type,
  CASE 
    WHEN type = 'admin' THEN '✅ Eres admin'
    ELSE '⚠️  No eres admin'
  END as estado
FROM profiles
WHERE id = auth.uid();

-- ============================================================================
-- 9. POLÍTICAS QUE NECESITAN REVISIÓN
-- ============================================================================

SELECT '⚠️  POLÍTICAS A REVISAR' as seccion, '' as detalle;

SELECT 
  schemaname as schema,
  tablename as tabla,
  policyname as politica,
  '⚠️  Aún usa auth.users.raw_user_meta_data' as problema
FROM pg_policies
WHERE (qual::text LIKE '%raw_user_meta_data%' 
   OR with_check::text LIKE '%raw_user_meta_data%')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 10. RESUMEN FINAL
-- ============================================================================

SELECT '🎯 RESUMEN FINAL' as seccion, '' as detalle;

WITH stats AS (
  SELECT 
    COUNT(*) as total_politicas,
    COUNT(*) FILTER (WHERE qual::text LIKE '%profiles.type%' OR with_check::text LIKE '%profiles.type%') as usa_profiles,
    COUNT(*) FILTER (WHERE qual::text LIKE '%raw_user_meta_data%') as usa_metadata
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  CASE 
    WHEN usa_profiles >= 25 AND usa_metadata = 0
    THEN '✅ MIGRACIÓN RLS EXITOSA - TODO OK'
    WHEN usa_profiles > 0 AND usa_metadata = 0
    THEN '✅ MIGRACIÓN COMPLETADA - Menos políticas de lo esperado pero correctas'
    WHEN usa_metadata > 0
    THEN '⚠️  HAY POLÍTICAS POR ACTUALIZAR'
    ELSE '❌ ERROR - Revisar políticas'
  END as estado,
  total_politicas as total,
  usa_profiles as con_profiles,
  usa_metadata as con_metadata
FROM stats;

-- ============================================================================
-- FIN DEL SCRIPT DE VERIFICACIÓN
-- ============================================================================

