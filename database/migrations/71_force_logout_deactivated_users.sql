-- ============================================================================
-- SCRIPT: Forzar cierre de sesión de usuarios desactivados
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Invalidar todas las sesiones de usuarios con cuentas desactivadas
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
-- PASO 2: Eliminar sesiones de usuarios desactivados
-- ============================================================================

-- ⚠️ IMPORTANTE: Esto cerrará la sesión inmediatamente
-- El usuario será redirigido al login en su próximo request

DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM profiles WHERE account_active = false
);

-- ============================================================================
-- PASO 3: Verificar que se eliminaron las sesiones
-- ============================================================================

SELECT
  '✅ VERIFICACIÓN FINAL' as estado,
  COUNT(*) as sesiones_activas_desactivados
FROM auth.sessions s
INNER JOIN profiles p ON p.id = s.user_id
WHERE p.account_active = false;

-- Debe devolver 0
