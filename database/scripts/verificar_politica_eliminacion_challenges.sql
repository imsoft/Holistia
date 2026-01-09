-- ============================================================================
-- SCRIPT: Verificar política de eliminación de challenges para admins
-- ============================================================================
-- Propósito: Diagnosticar por qué los admins no pueden eliminar retos de pacientes
-- ============================================================================

-- 1. Verificar la política de eliminación actual
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'challenges'
  AND schemaname = 'public'
  AND cmd = 'DELETE'
ORDER BY policyname;

-- 2. Verificar si el admin tiene account_active = true
SELECT 
  id,
  type,
  account_active,
  CASE 
    WHEN type = 'admin' AND account_active = true THEN '✅ Admin activo'
    WHEN type = 'admin' AND account_active = false THEN '⚠️ Admin inactivo'
    WHEN type != 'admin' THEN '❌ No es admin'
    ELSE '❓ Estado desconocido'
  END as estado_admin
FROM public.profiles
WHERE type = 'admin'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar si la política permite a admins eliminar cualquier reto
-- Esta consulta simula la verificación que hace la política
SELECT 
  'Verificación de política DELETE para admins' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND type = 'admin'
      AND account_active = true
    ) THEN '✅ Admin puede eliminar (según política)'
    ELSE '❌ Admin NO puede eliminar (según política)'
  END as resultado;

-- 4. Listar algunos retos de pacientes para verificar
SELECT 
  id,
  title,
  created_by_user_id,
  created_by_type,
  professional_id,
  is_active,
  created_at
FROM public.challenges
WHERE created_by_type = 'patient'
ORDER BY created_at DESC
LIMIT 5;
