-- ============================================================================
-- Script: Diagnosticar profesional faltante
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Verificar por qué el profesional no existe y encontrar soluciones
-- ============================================================================

-- PASO 1: Verificar si el profesional existe
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  is_active,
  registration_fee_paid
FROM professional_applications
WHERE id = '247931aa-47bb-4b33-b43e-89b5485f2a72';

-- PASO 2: Buscar profesionales con user_id similar
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  is_active
FROM professional_applications
WHERE user_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
ORDER BY created_at DESC;

-- PASO 3: Verificar los servicios y su user_id
SELECT 
  id,
  professional_id,
  user_id,
  name,
  isactive,
  created_at
FROM professional_services
WHERE professional_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
   OR user_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
ORDER BY created_at DESC;

-- PASO 4: Buscar si hay algún profesional con user_id que coincida con los servicios
SELECT 
  ps.id as servicio_id,
  ps.professional_id as servicio_professional_id,
  ps.user_id as servicio_user_id,
  pa.id as profesional_id,
  pa.user_id as profesional_user_id,
  pa.first_name,
  pa.last_name,
  pa.status,
  CASE 
    WHEN pa.id IS NULL THEN '❌ No hay profesional con ese professional_id'
    WHEN ps.user_id = pa.user_id THEN '✅ user_id coincide'
    ELSE '⚠️ user_id NO coincide'
  END as estado
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.id IN (
  '06fdc266-3c3e-47d9-aad9-c8f665d18343',
  '2800184d-bfda-41c2-9476-abb580cc5bcb'
);

-- PASO 5: Buscar profesionales activos que podrían ser el correcto
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  is_active,
  created_at
FROM professional_applications
WHERE status = 'approved'
  AND is_active = true
  AND user_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- ANÁLISIS
-- ============================================================================
-- Si el PASO 1 no devuelve resultados, el profesional fue eliminado o nunca existió.
-- Si el PASO 2 devuelve resultados, significa que hay un profesional con ese user_id
-- pero con un professional_id diferente. En ese caso, necesitamos actualizar el
-- professional_id de los servicios.
-- ============================================================================
