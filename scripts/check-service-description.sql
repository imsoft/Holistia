-- ============================================================================
-- Script SIMPLE para verificar el campo description de un servicio
-- ============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza el UUID en la línea 7 con el ID del servicio
-- 2. Ejecuta en Supabase Dashboard → SQL Editor
-- 
-- ============================================================================

-- ⚠️ CAMBIAR ESTE SERVICE_ID:
SELECT 
  id,
  name,
  description, -- ⚠️ ESTE ES EL CAMPO QUE NECESITAMOS VER
  CASE 
    WHEN description IS NULL THEN '❌ NULL - El servicio NO tiene descripción'
    WHEN description = '' THEN '⚠️ VACÍO - El servicio tiene descripción vacía'
    ELSE '✅ TIENE CONTENIDO (' || LENGTH(description) || ' caracteres)'
  END as descripcion_estado,
  LEFT(COALESCE(description, ''), 300) as descripcion_preview, -- Primeros 300 caracteres
  type,
  modality
FROM professional_services
WHERE id = '77b20482-5e50-40ae-9ea4-3673b88e8f23'; -- ⚠️ CAMBIAR ESTE ID
