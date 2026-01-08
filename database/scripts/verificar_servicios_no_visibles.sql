-- ============================================================================
-- Script: Verificar por qué los servicios no se ven en la aplicación
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Diagnosticar por qué los servicios no aparecen
-- ============================================================================

-- PASO 1: Verificar los servicios específicos mencionados
SELECT 
  id,
  professional_id,
  user_id,
  name,
  isactive,
  created_at,
  updated_at
FROM professional_services
WHERE id IN (
  '06fdc266-3c3e-47d9-aad9-c8f665d18343',
  '2800184d-bfda-41c2-9476-abb580cc5bcb'
)
ORDER BY created_at DESC;

-- PASO 2: Verificar el estado del profesional
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  status,
  is_active,
  registration_fee_paid
FROM professional_applications
WHERE id = '247931aa-47bb-4b33-b43e-89b5485f2a72';

-- PASO 3: Verificar todos los servicios del profesional
SELECT 
  id,
  professional_id,
  user_id,
  name,
  isactive,
  created_at
FROM professional_services
WHERE professional_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
ORDER BY created_at DESC;

-- PASO 4: Verificar políticas RLS activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'professional_services'
ORDER BY policyname;

-- PASO 5: Verificar si hay problemas con user_id vs professional_id
SELECT 
  ps.id,
  ps.professional_id,
  ps.user_id,
  pa.user_id as professional_user_id,
  ps.name,
  ps.isactive,
  CASE 
    WHEN ps.user_id = pa.user_id THEN '✅ Coincide'
    ELSE '❌ NO coincide'
  END as user_id_match
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.professional_id = '247931aa-47bb-4b33-b43e-89b5485f2a72';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Si user_id no coincide con professional_applications.user_id, podría haber
-- problemas con las políticas RLS que verifican user_id = auth.uid()
-- ============================================================================
