-- ============================================================================
-- AUDITORÍA DE SEGURIDAD - HOLISTIA
-- ============================================================================
-- Verifica que todas las políticas RLS estén correctamente configuradas
-- y que la aplicación sea segura
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR QUE RLS ESTÉ HABILITADO EN TODAS LAS TABLAS
-- ============================================================================

SELECT 
  '🔒 TABLAS CON RLS' as seccion,
  '' as espacio;

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Habilitado'
    ELSE '❌ RLS DESHABILITADO - PELIGRO'
  END as estado_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'appointments',
    'payments',
    'professional_applications',
    'events_workshops',
    'event_registrations',
    'availability_schedules',
    'blocked_times',
    'services',
    'reviews'
  )
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFICAR POLÍTICAS RLS POR TABLA
-- ============================================================================

SELECT 
  '📋 POLÍTICAS RLS POR TABLA' as seccion,
  '' as espacio;

SELECT 
  tablename,
  COUNT(*) as num_policies,
  STRING_AGG(DISTINCT cmd::text, ', ') as operaciones_permitidas,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Tiene políticas'
    ELSE '⚠️ Pocas políticas'
  END as evaluacion
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 3. VERIFICAR QUE NO HAYA POLÍTICAS INSEGURAS
-- ============================================================================

SELECT 
  '⚠️ POLÍTICAS POTENCIALMENTE INSEGURAS' as seccion,
  '' as espacio;

SELECT 
  tablename,
  policyname,
  cmd,
  '⚠️ Política muy permisiva' as advertencia
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual = 'true' -- Permite acceso sin restricciones
    OR qual IS NULL
  )
  AND cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. VERIFICAR AUTENTICACIÓN REQUERIDA
-- ============================================================================

SELECT 
  '🔐 VERIFICAR AUTH.UID() EN POLÍTICAS' as seccion,
  '' as espacio;

SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE qual LIKE '%auth.uid()%') as policies_con_auth,
  CASE 
    WHEN COUNT(*) FILTER (WHERE qual LIKE '%auth.uid()%') >= COUNT(*) * 0.8 
    THEN '✅ Mayoría requiere autenticación'
    ELSE '⚠️ Algunas no requieren auth'
  END as evaluacion
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('SELECT', 'UPDATE', 'DELETE')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 5. VERIFICAR SEPARACIÓN DE ROLES
-- ============================================================================

SELECT 
  '👥 SEPARACIÓN DE ROLES' as seccion,
  '' as espacio;

-- Contar políticas por tipo de usuario
SELECT 
  CASE 
    WHEN policyname LIKE '%Admin%' THEN 'Admin'
    WHEN policyname LIKE '%Professional%' THEN 'Professional'
    WHEN policyname LIKE '%Patient%' OR policyname LIKE '%Users%' THEN 'Patient/User'
    ELSE 'System/Other'
  END as tipo_usuario,
  COUNT(*) as num_policies,
  STRING_AGG(DISTINCT tablename, ', ') as tablas_afectadas
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY 1
ORDER BY 2 DESC;

-- ============================================================================
-- 6. VERIFICAR PROTECCIÓN DE DATOS SENSIBLES
-- ============================================================================

SELECT 
  '🔒 PROTECCIÓN DE DATOS SENSIBLES' as seccion,
  '' as espacio;

-- Verificar que appointments tenga protección
SELECT 
  'appointments' as tabla,
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND policyname LIKE '%Patient%') as politicas_paciente,
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND policyname LIKE '%Professional%') as politicas_profesional,
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND policyname LIKE '%Admin%') as politicas_admin,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ Bien protegido'
    ELSE '⚠️ Revisar protección'
  END as evaluacion
FROM pg_policies
WHERE tablename = 'appointments';

-- Verificar que payments tenga protección
SELECT 
  'payments' as tabla,
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND policyname LIKE '%Patient%') as politicas_paciente,
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND policyname LIKE '%Professional%') as politicas_profesional,
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND policyname LIKE '%Admin%') as politicas_admin,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ Bien protegido'
    ELSE '⚠️ Revisar protección'
  END as evaluacion
FROM pg_policies
WHERE tablename = 'payments';

-- ============================================================================
-- 7. VERIFICAR QUE NO HAYA DATOS EXPUESTOS
-- ============================================================================

SELECT 
  '🔍 VERIFICAR VISTAS PÚBLICAS' as seccion,
  '' as espacio;

SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN viewname LIKE '%public%' THEN '⚠️ Vista pública - revisar'
    WHEN viewname LIKE '%patient_info%' THEN '✅ Vista controlada'
    ELSE '✓ OK'
  END as evaluacion
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- ============================================================================
-- 8. VERIFICAR ENCRIPTACIÓN DE CONTRASEÑAS
-- ============================================================================

SELECT 
  '🔐 VERIFICAR USUARIOS AUTH' as seccion,
  '' as espacio;

SELECT 
  COUNT(*) as total_usuarios,
  COUNT(*) FILTER (WHERE encrypted_password IS NOT NULL) as con_password_encriptado,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE encrypted_password IS NOT NULL) 
    THEN '✅ Todos con password encriptado'
    ELSE '❌ PELIGRO: Algunos sin encriptar'
  END as evaluacion
FROM auth.users;

-- ============================================================================
-- 9. VERIFICAR TOKENS Y SESIONES
-- ============================================================================

SELECT 
  '🎫 VERIFICAR CONFIGURACIÓN DE SESIONES' as seccion,
  '' as espacio;

-- Verificar que no haya tokens antiguos activos
SELECT 
  COUNT(*) as sesiones_activas,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') as sesiones_recientes,
  COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '30 days') as sesiones_antiguas,
  CASE 
    WHEN COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '30 days') = 0 
    THEN '✅ No hay sesiones antiguas'
    ELSE '⚠️ Hay sesiones antiguas - considerar limpiar'
  END as evaluacion
FROM auth.sessions;

-- ============================================================================
-- 10. RESUMEN FINAL DE SEGURIDAD
-- ============================================================================

SELECT 
  '📊 RESUMEN FINAL DE SEGURIDAD' as seccion,
  '' as espacio;

WITH security_checks AS (
  SELECT 
    'RLS Habilitado' as check_name,
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' 
     AND tablename IN ('appointments', 'payments', 'professional_applications')
     AND rowsecurity = true) as actual,
    3 as expected
  
  UNION ALL
  
  SELECT 
    'Políticas por Tabla',
    (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public'),
    8
  
  UNION ALL
  
  SELECT 
    'Políticas Totales',
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
    20
  
  UNION ALL
  
  SELECT 
    'Usuarios con Password Encriptado',
    (SELECT COUNT(*) FROM auth.users WHERE encrypted_password IS NOT NULL),
    (SELECT COUNT(*) FROM auth.users)
)
SELECT 
  check_name,
  actual,
  expected,
  CASE 
    WHEN actual >= expected THEN '✅ PASS'
    WHEN actual >= expected * 0.8 THEN '⚠️ REVISAR'
    ELSE '❌ FAIL'
  END as resultado,
  ROUND((actual::numeric / NULLIF(expected, 0) * 100), 1) || '%' as porcentaje
FROM security_checks;

-- ============================================================================
-- FIN DE AUDITORÍA
-- ============================================================================

SELECT 
  '✅ AUDITORÍA COMPLETADA' as resultado,
  'Revisa los resultados anteriores para verificar la seguridad' as recomendacion;

