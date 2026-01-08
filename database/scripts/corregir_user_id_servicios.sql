-- ============================================================================
-- Script: Corregir user_id de servicios que no coinciden
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Corregir el user_id de los servicios para que coincida con el
--            user_id del profesional en professional_applications
-- ============================================================================

-- PASO 1: Verificar el profesional y su user_id
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

-- PASO 2: Verificar servicios con user_id incorrecto
SELECT 
  ps.id,
  ps.professional_id,
  ps.user_id as servicio_user_id,
  pa.user_id as profesional_user_id,
  ps.name,
  ps.isactive,
  CASE 
    WHEN ps.user_id = pa.user_id THEN '✅ Coincide'
    WHEN pa.user_id IS NULL THEN '❌ Profesional no encontrado'
    ELSE '❌ NO coincide - necesita corrección'
  END as estado
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.professional_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
ORDER BY ps.created_at DESC;

-- PASO 3: Corregir user_id de los servicios
-- IMPORTANTE: Ejecutar solo si el PASO 1 muestra un user_id válido
DO $$
DECLARE
  v_professional_user_id UUID;
  v_services_updated INTEGER;
BEGIN
  -- Obtener el user_id correcto del profesional
  SELECT user_id INTO v_professional_user_id
  FROM professional_applications
  WHERE id = '247931aa-47bb-4b33-b43e-89b5485f2a72';
  
  IF v_professional_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el profesional con ID 247931aa-47bb-4b33-b43e-89b5485f2a72';
  END IF;
  
  -- Actualizar los servicios con el user_id correcto
  UPDATE professional_services
  SET 
    user_id = v_professional_user_id,
    updated_at = NOW()
  WHERE professional_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
    AND user_id != v_professional_user_id;
  
  GET DIAGNOSTICS v_services_updated = ROW_COUNT;
  
  RAISE NOTICE 'Servicios actualizados: %', v_services_updated;
  RAISE NOTICE 'user_id correcto: %', v_professional_user_id;
END $$;

-- PASO 4: Verificar la corrección
SELECT 
  ps.id,
  ps.professional_id,
  ps.user_id as servicio_user_id,
  pa.user_id as profesional_user_id,
  ps.name,
  ps.isactive,
  CASE 
    WHEN ps.user_id = pa.user_id THEN '✅ Coincide'
    ELSE '❌ Aún no coincide'
  END as estado
FROM professional_services ps
LEFT JOIN professional_applications pa ON ps.professional_id = pa.id
WHERE ps.professional_id = '247931aa-47bb-4b33-b43e-89b5485f2a72'
ORDER BY ps.created_at DESC;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Si el PASO 1 no muestra resultados, significa que el profesional no existe
-- o el ID está incorrecto. Verificar el ID del profesional.
-- ============================================================================
