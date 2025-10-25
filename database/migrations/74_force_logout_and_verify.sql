-- ============================================================================
-- SCRIPT: Forzar logout y verificar bloqueo completo
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Eliminar sesiones y verificar que el sistema bloquee correctamente
-- ============================================================================

-- ============================================================================
-- PASO 1: Ver sesiones activas de usuarios desactivados
-- ============================================================================

SELECT
  '⚠️ SESIONES ACTIVAS DE USUARIOS DESACTIVADOS' as alerta,
  s.id as session_id,
  s.user_id,
  p.email,
  p.account_active,
  s.created_at as session_created,
  s.updated_at as session_updated
FROM auth.sessions s
INNER JOIN profiles p ON p.id = s.user_id
WHERE p.account_active = false
ORDER BY s.updated_at DESC;

-- ============================================================================
-- PASO 2: Eliminar TODAS las sesiones de usuarios desactivados
-- ============================================================================

DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM profiles WHERE account_active = false
);

-- ============================================================================
-- PASO 3: Eliminar TODOS los refresh tokens de usuarios desactivados
-- ============================================================================

DELETE FROM auth.refresh_tokens
WHERE user_id IN (
  SELECT id FROM profiles WHERE account_active = false
);

-- ============================================================================
-- PASO 4: Verificar que NO queden sesiones
-- ============================================================================

SELECT
  '✅ SESIONES ELIMINADAS' as estado,
  COUNT(*) as sesiones_activas_desactivados
FROM auth.sessions s
INNER JOIN profiles p ON p.id = s.user_id
WHERE p.account_active = false;

-- Debe devolver 0

-- ============================================================================
-- PASO 5: Verificar políticas RLS están activas
-- ============================================================================

SELECT
  '✅ POLÍTICAS RLS ACTIVAS' as estado,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- PASO 6: Probar la función is_account_active
-- ============================================================================

SELECT
  '🧪 FUNCIÓN is_account_active()' as test,
  public.is_account_active() as resultado,
  CASE
    WHEN public.is_account_active() = true THEN '✅ Cuenta activa - puede acceder'
    WHEN public.is_account_active() = false THEN '❌ Cuenta desactivada - BLOQUEADO'
    ELSE '⚠️ No autenticado'
  END as estado;

-- ============================================================================
-- PASO 7: Verificar usuarios desactivados
-- ============================================================================

SELECT
  '📋 RESUMEN DE USUARIOS DESACTIVADOS' as reporte,
  COUNT(*) as total_desactivados,
  COUNT(CASE WHEN deactivated_at > NOW() - INTERVAL '1 hour' THEN 1 END) as desactivados_ultima_hora,
  COUNT(CASE WHEN deactivated_at > NOW() - INTERVAL '1 day' THEN 1 END) as desactivados_ultimo_dia
FROM profiles
WHERE account_active = false;

-- Lista de usuarios desactivados
SELECT
  '👥 LISTA DE USUARIOS DESACTIVADOS' as lista,
  id,
  email,
  type,
  deactivated_at,
  EXTRACT(EPOCH FROM (NOW() - deactivated_at))/60 as minutos_desde_desactivacion
FROM profiles
WHERE account_active = false
ORDER BY deactivated_at DESC;
