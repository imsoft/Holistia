-- ============================================================================
-- Script para verificar datos de un servicio específico
-- ============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza el service_id con el ID del servicio que quieres verificar
-- 2. Ejecuta en Supabase Dashboard → SQL Editor
-- 
-- ============================================================================

-- ⚠️ CAMBIAR ESTE SERVICE_ID:
\set service_id '77b20482-5e50-40ae-9ea4-3673b88e8f23'

-- Ver todos los datos del servicio
SELECT 
  id,
  name,
  description,
  type,
  modality,
  duration,
  cost,
  program_duration,
  address,
  image_url,
  isactive,
  created_at,
  updated_at
FROM professional_services
WHERE id = :'service_id';

-- Verificar si description es NULL o vacío
SELECT 
  id,
  name,
  CASE 
    WHEN description IS NULL THEN '❌ NULL'
    WHEN description = '' THEN '⚠️ VACÍO'
    ELSE '✅ TIENE CONTENIDO'
  END as descripcion_estado,
  LENGTH(description) as descripcion_longitud,
  CASE 
    WHEN type IS NULL THEN '❌ NULL'
    WHEN type NOT IN ('session', 'program') THEN '⚠️ INVÁLIDO: ' || type
    ELSE '✅ VÁLIDO: ' || type
  END as tipo_estado
FROM professional_services
WHERE id = :'service_id';

-- Verificar estructura de program_duration si existe
SELECT 
  id,
  name,
  type,
  program_duration,
  CASE 
    WHEN program_duration IS NULL THEN 'NULL'
    WHEN jsonb_typeof(program_duration) = 'object' THEN 'OBJETO JSON'
    ELSE 'OTRO TIPO: ' || jsonb_typeof(program_duration)
  END as program_duration_tipo,
  program_duration->>'value' as program_duration_value,
  program_duration->>'unit' as program_duration_unit
FROM professional_services
WHERE id = :'service_id';
