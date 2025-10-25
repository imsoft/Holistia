-- ============================================================================
-- ESTADÍSTICAS PRE-MIGRACIÓN A public.profiles
-- ============================================================================
-- Ejecutar este script en Supabase SQL Editor ANTES de iniciar la migración
-- Guardar los resultados para comparar después
-- ============================================================================

-- 1. Total de usuarios
SELECT 
  '📊 ESTADÍSTICAS GENERALES' as seccion,
  'Total de usuarios' as metrica,
  COUNT(*)::text as valor
FROM auth.users

UNION ALL

-- 2. Distribución por tipo
SELECT 
  '📊 ESTADÍSTICAS GENERALES',
  'Tipo: ' || COALESCE(raw_user_meta_data->>'type', 'sin_tipo'),
  COUNT(*)::text
FROM auth.users
GROUP BY raw_user_meta_data->>'type'

UNION ALL

-- 3. Usuarios con datos en user_metadata
SELECT 
  '📝 DATOS EN USER_METADATA',
  'Con first_name',
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'first_name' IS NOT NULL)::text
FROM auth.users

UNION ALL

SELECT 
  '📝 DATOS EN USER_METADATA',
  'Con last_name',
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'last_name' IS NOT NULL)::text
FROM auth.users

UNION ALL

SELECT 
  '📝 DATOS EN USER_METADATA',
  'Con phone',
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'phone' IS NOT NULL)::text
FROM auth.users

UNION ALL

SELECT 
  '📝 DATOS EN USER_METADATA',
  'Con avatar_url',
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'avatar_url' IS NOT NULL)::text
FROM auth.users

UNION ALL

SELECT 
  '📝 DATOS EN USER_METADATA',
  'Con type definido',
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' IS NOT NULL)::text
FROM auth.users

UNION ALL

-- 4. Tablas relacionadas
SELECT 
  '🔗 TABLAS RELACIONADAS',
  'Pacientes únicos en appointments',
  COUNT(DISTINCT patient_id)::text
FROM appointments

UNION ALL

SELECT 
  '🔗 TABLAS RELACIONADAS',
  'Total de profesionales',
  COUNT(*)::text
FROM professional_applications

UNION ALL

SELECT 
  '🔗 TABLAS RELACIONADAS',
  'Usuarios en eventos',
  COUNT(DISTINCT user_id)::text
FROM event_registrations

UNION ALL

SELECT 
  '🔗 TABLAS RELACIONADAS',
  'Usuarios con favoritos',
  COUNT(DISTINCT user_id)::text
FROM user_favorites

UNION ALL

-- 5. Pagos
SELECT 
  '💰 PAGOS',
  'Total de pagos',
  COUNT(*)::text
FROM payments

UNION ALL

SELECT 
  '💰 PAGOS',
  'Pagos exitosos',
  COUNT(*) FILTER (WHERE status = 'succeeded')::text
FROM payments

UNION ALL

-- 6. Citas
SELECT 
  '📅 CITAS',
  'Total de citas',
  COUNT(*)::text
FROM appointments

UNION ALL

SELECT 
  '📅 CITAS',
  'Citas confirmadas',
  COUNT(*) FILTER (WHERE status = 'confirmed')::text
FROM appointments

UNION ALL

SELECT 
  '📅 CITAS',
  'Citas completadas',
  COUNT(*) FILTER (WHERE status = 'completed')::text
FROM appointments

UNION ALL

-- 7. Eventos
SELECT 
  '🎪 EVENTOS',
  'Total de eventos',
  COUNT(*)::text
FROM events_workshops

UNION ALL

SELECT 
  '🎪 EVENTOS',
  'Total de registros a eventos',
  COUNT(*)::text
FROM event_registrations

UNION ALL

-- 8. Políticas RLS con auth.users
SELECT 
  '🔒 SEGURIDAD (RLS)',
  'Políticas que referencian auth.users',
  COUNT(DISTINCT tablename)::text || ' tablas'
FROM pg_policies
WHERE definition LIKE '%auth.users%'

ORDER BY seccion, metrica;

-- ============================================================================
-- DETALLE: Usuarios por tipo con conteo
-- ============================================================================

SELECT 
  '👥 DETALLE POR TIPO DE USUARIO' as seccion,
  '' as separador;

SELECT 
  COALESCE(u.raw_user_meta_data->>'type', 'sin_tipo') as tipo_usuario,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as porcentaje
FROM auth.users u
GROUP BY tipo_usuario
ORDER BY cantidad DESC;

-- ============================================================================
-- DETALLE: Primeros 5 usuarios de ejemplo (para verificar datos)
-- ============================================================================

SELECT 
  '📋 MUESTRA DE DATOS (primeros 5 usuarios)' as seccion,
  '' as separador;

SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  u.raw_user_meta_data->>'phone' as phone,
  u.raw_user_meta_data->>'type' as type,
  u.created_at
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 5;

-- ============================================================================
-- VERIFICACIÓN: Datos que se perderían si no migramos
-- ============================================================================

SELECT 
  '⚠️ VERIFICACIÓN DE INTEGRIDAD' as seccion,
  '' as separador;

-- Usuarios sin email (anomalía)
SELECT 
  'Usuarios sin email' as verificacion,
  COUNT(*) as cantidad,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ REVISAR'
  END as estado
FROM auth.users
WHERE email IS NULL OR email = ''

UNION ALL

-- Usuarios con user_metadata vacío
SELECT 
  'Usuarios sin metadata',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ Algunos usuarios sin datos adicionales'
  END
FROM auth.users
WHERE raw_user_meta_data IS NULL OR raw_user_meta_data = '{}'::jsonb

UNION ALL

-- Usuarios con type no estándar
SELECT 
  'Usuarios con type no estándar',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ REVISAR tipos'
  END
FROM auth.users
WHERE raw_user_meta_data->>'type' NOT IN ('admin', 'patient', 'professional')
  AND raw_user_meta_data->>'type' IS NOT NULL;

-- ============================================================================
-- PERFORMANCE BASELINE: Query actual con user_metadata
-- ============================================================================

SELECT 
  '⚡ PERFORMANCE BASELINE' as seccion,
  '' as separador;

EXPLAIN ANALYZE
SELECT 
  pa.id,
  pa.first_name,
  pa.last_name,
  u.raw_user_meta_data->>'type' as user_type,
  u.email
FROM professional_applications pa
LEFT JOIN auth.users u ON u.id = pa.user_id
WHERE u.raw_user_meta_data->>'type' = 'admin'
LIMIT 10;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Guardar estos resultados para compararlos después de la migración
-- ============================================================================

