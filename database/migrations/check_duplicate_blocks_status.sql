-- Script para verificar el estado actual de bloques duplicados
-- Ejecuta esto ANTES de aplicar la migración 131

-- 1. Resumen general de duplicados
SELECT
  'Total de bloques externos' as metric,
  COUNT(*) as value
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL

UNION ALL

SELECT
  'Bloques únicos (sin duplicados)' as metric,
  COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as value
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL

UNION ALL

SELECT
  'Total de duplicados a eliminar' as metric,
  COUNT(*) - COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as value
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- 2. Duplicados por profesional
SELECT
  p.first_name || ' ' || p.last_name as professional_name,
  ab.professional_id,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as unique_blocks,
  COUNT(*) - COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as duplicates_to_remove
FROM availability_blocks ab
LEFT JOIN professional_applications p ON ab.professional_id = p.id
WHERE ab.is_external_event = true
  AND ab.google_calendar_event_id IS NOT NULL
GROUP BY ab.professional_id, p.first_name, p.last_name
ORDER BY duplicates_to_remove DESC;

-- 3. Ejemplos de grupos duplicados (máximo 10)
SELECT
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day') as start_time,
  COALESCE(end_time::text, 'full_day') as end_time,
  title,
  COUNT(*) as duplicate_count,
  MIN(created_at) as oldest_created_at,
  MAX(created_at) as newest_created_at
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL
GROUP BY
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day'),
  COALESCE(end_time::text, 'full_day'),
  title
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 4. Verificar si el índice único ya existe
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'availability_blocks'
  AND indexname = 'idx_availability_blocks_unique_external_event';
