-- ============================================================================
-- Script: Corregir servicios cuando el profesional no existe
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Encontrar el profesional correcto y corregir los servicios
-- ============================================================================

-- PASO 1: Verificar si existe algún profesional con ese user_id
SELECT 
  id as professional_id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  is_active,
  registration_fee_paid,
  created_at
FROM professional_applications
WHERE user_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
ORDER BY created_at DESC;

-- PASO 2: Ver todos los servicios que tienen ese user_id o professional_id
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

-- PASO 3: Buscar profesionales aprobados y activos recientes (por si el ID cambió)
SELECT 
  id as professional_id,
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

-- PASO 4: Si encuentras el profesional correcto en el PASO 1 o 3, ejecuta esto:
-- IMPORTANTE: Reemplaza 'NUEVO_PROFESSIONAL_ID' con el ID correcto del PASO 1 o 3
/*
DO $$
DECLARE
  v_correct_professional_id UUID := 'NUEVO_PROFESSIONAL_ID'; -- ⚠️ REEMPLAZAR CON EL ID CORRECTO
  v_correct_user_id UUID := '247931aa-47bb-4b33-b43e-89b5485f2a72';
  v_services_updated INTEGER;
BEGIN
  -- Verificar que el profesional existe
  IF NOT EXISTS (
    SELECT 1 FROM professional_applications 
    WHERE id = v_correct_professional_id 
    AND user_id = v_correct_user_id
  ) THEN
    RAISE EXCEPTION 'El profesional con ID % y user_id % no existe', v_correct_professional_id, v_correct_user_id;
  END IF;
  
  -- Actualizar los servicios con el professional_id y user_id correctos
  UPDATE professional_services
  SET 
    professional_id = v_correct_professional_id,
    user_id = v_correct_user_id,
    updated_at = NOW()
  WHERE id IN (
    '06fdc266-3c3e-47d9-aad9-c8f665d18343',
    '2800184d-bfda-41c2-9476-abb580cc5bcb'
  );
  
  GET DIAGNOSTICS v_services_updated = ROW_COUNT;
  
  RAISE NOTICE '✅ Servicios actualizados: %', v_services_updated;
  RAISE NOTICE '✅ professional_id correcto: %', v_correct_professional_id;
  RAISE NOTICE '✅ user_id correcto: %', v_correct_user_id;
END $$;
*/

-- PASO 5: Verificar la corrección (ejecutar después del PASO 4)
SELECT 
  ps.id,
  ps.professional_id,
  ps.user_id,
  pa.id as profesional_existe,
  pa.user_id as profesional_user_id,
  pa.first_name,
  pa.last_name,
  ps.name,
  CASE 
    WHEN pa.id IS NOT NULL AND ps.user_id = pa.user_id THEN '✅ Correcto'
    WHEN pa.id IS NULL THEN '❌ Profesional no existe'
    ELSE '⚠️ user_id no coincide'
  END as estado
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.id IN (
  '06fdc266-3c3e-47d9-aad9-c8f665d18343',
  '2800184d-bfda-41c2-9476-abb580cc5bcb'
);

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
-- 1. Ejecuta el PASO 1 para encontrar el profesional con ese user_id
-- 2. Si encuentras un profesional, copia su ID (professional_id)
-- 3. Ejecuta el PASO 4 reemplazando 'NUEVO_PROFESSIONAL_ID' con el ID encontrado
-- 4. Ejecuta el PASO 5 para verificar que la corrección funcionó
-- ============================================================================
