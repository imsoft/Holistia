-- ============================================================================
-- Script: Corregir professional_id de servicios
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Corregir el professional_id de los servicios que tienen el user_id
--            en lugar del ID correcto del profesional
-- ============================================================================

-- CORRECCIÓN AUTOMÁTICA
-- El profesional correcto es:
--   professional_id: bd8101ae-2d9e-4cf8-a9a7-927b69e9359c
--   user_id: 247931aa-47bb-4b33-b43e-89b5485f2a72

DO $$
DECLARE
  v_correct_professional_id UUID := 'bd8101ae-2d9e-4cf8-a9a7-927b69e9359c';
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

-- VERIFICACIÓN: Verificar que la corrección funcionó
SELECT 
  ps.id,
  ps.professional_id,
  ps.user_id,
  pa.id as profesional_existe,
  pa.user_id as profesional_user_id,
  pa.first_name,
  pa.last_name,
  pa.status,
  pa.is_active,
  ps.name,
  ps.isactive,
  CASE 
    WHEN pa.id IS NOT NULL 
         AND ps.professional_id = pa.id 
         AND ps.user_id = pa.user_id 
         AND pa.status = 'approved'
         AND pa.is_active = true THEN '✅ Correcto - Visible'
    WHEN pa.id IS NULL THEN '❌ Profesional no existe'
    WHEN ps.professional_id != pa.id THEN '⚠️ professional_id no coincide'
    WHEN ps.user_id != pa.user_id THEN '⚠️ user_id no coincide'
    WHEN pa.status != 'approved' THEN '⚠️ Profesional no aprobado'
    WHEN pa.is_active != true THEN '⚠️ Profesional inactivo'
    ELSE '⚠️ Estado desconocido'
  END as estado
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.id IN (
  '06fdc266-3c3e-47d9-aad9-c8f665d18343',
  '2800184d-bfda-41c2-9476-abb580cc5bcb'
);

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Este script corrige el professional_id de los servicios para que apunten
-- al profesional correcto (bd8101ae-2d9e-4cf8-a9a7-927b69e9359c) en lugar
-- del user_id (247931aa-47bb-4b33-b43e-89b5485f2a72).
-- ============================================================================
