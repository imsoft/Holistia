-- ============================================================================
-- AUDITORÍA DE SEGURIDAD SIMPLIFICADA - TODO EN UNA TABLA
-- ============================================================================

WITH 
-- 1. RLS Habilitado
rls_check AS (
  SELECT 
    '1. RLS Habilitado' as categoria,
    tablename as detalle,
    CASE 
      WHEN rowsecurity = true THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as estado
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('appointments', 'payments', 'professional_applications', 'events_workshops')
),

-- 2. Políticas por Tabla
policies_count AS (
  SELECT 
    '2. Políticas RLS' as categoria,
    tablename || ' (' || COUNT(*)::text || ' políticas)' as detalle,
    CASE 
      WHEN COUNT(*) >= 2 THEN '✅ PASS'
      ELSE '⚠️ REVISAR'
    END as estado
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('appointments', 'payments', 'professional_applications')
  GROUP BY tablename
),

-- 3. Usuarios con Password Encriptado
users_check AS (
  SELECT 
    '3. Autenticación' as categoria,
    COUNT(*) FILTER (WHERE encrypted_password IS NOT NULL)::text || ' con password, ' ||
    COUNT(*) FILTER (WHERE encrypted_password IS NULL)::text || ' con OAuth/Magic Link' as detalle,
    CASE 
      WHEN COUNT(*) > 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as estado
  FROM auth.users
),

-- 4. Protección de Appointments
appointments_protection AS (
  SELECT 
    '4. Protección Appointments' as categoria,
    COUNT(*)::text || ' políticas' as detalle,
    CASE 
      WHEN COUNT(*) >= 3 THEN '✅ PASS'
      ELSE '⚠️ REVISAR'
    END as estado
  FROM pg_policies
  WHERE tablename = 'appointments'
),

-- 5. Protección de Payments
payments_protection AS (
  SELECT 
    '5. Protección Payments' as categoria,
    COUNT(*)::text || ' políticas' as detalle,
    CASE 
      WHEN COUNT(*) >= 4 THEN '✅ PASS'
      ELSE '⚠️ REVISAR'
    END as estado
  FROM pg_policies
  WHERE tablename = 'payments'
),

-- 6. Roles Separados
roles_check AS (
  SELECT 
    '6. Separación de Roles' as categoria,
    'Admin, Professional, Patient políticas' as detalle,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname LIKE '%Admin%')
       AND EXISTS (SELECT 1 FROM pg_policies WHERE policyname LIKE '%Professional%')
       AND EXISTS (SELECT 1 FROM pg_policies WHERE policyname LIKE '%Patient%')
      THEN '✅ PASS'
      ELSE '⚠️ REVISAR'
    END as estado
),

-- 7. Vista Segura
secure_view AS (
  SELECT 
    '7. Vista Segura' as categoria,
    'professional_patient_info' as detalle,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'professional_patient_info')
      THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as estado
),

-- 8. Sesiones Activas
sessions_check AS (
  SELECT 
    '8. Sesiones' as categoria,
    COUNT(*)::text || ' sesiones activas' as detalle,
    '✅ INFO' as estado
  FROM auth.sessions
),

-- 9. Admins
admins_check AS (
  SELECT 
    '9. Usuarios Admin' as categoria,
    COUNT(*)::text || ' admins configurados' as detalle,
    CASE 
      WHEN COUNT(*) > 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as estado
  FROM auth.users
  WHERE raw_user_meta_data->>'type' = 'admin'
),

-- 10. Resumen Final
summary AS (
  SELECT 
    '10. RESUMEN' as categoria,
    'Total de políticas: ' || COUNT(*)::text as detalle,
    CASE 
      WHEN COUNT(*) >= 15 THEN '✅ SEGURO'
      WHEN COUNT(*) >= 10 THEN '⚠️ MEJORABLE'
      ELSE '❌ INSEGURO'
    END as estado
  FROM pg_policies
  WHERE schemaname = 'public'
)

-- Combinar todos los resultados
SELECT * FROM rls_check
UNION ALL
SELECT * FROM policies_count
UNION ALL
SELECT * FROM users_check
UNION ALL
SELECT * FROM appointments_protection
UNION ALL
SELECT * FROM payments_protection
UNION ALL
SELECT * FROM roles_check
UNION ALL
SELECT * FROM secure_view
UNION ALL
SELECT * FROM sessions_check
UNION ALL
SELECT * FROM admins_check
UNION ALL
SELECT * FROM summary
ORDER BY categoria;

