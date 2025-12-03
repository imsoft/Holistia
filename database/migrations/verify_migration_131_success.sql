-- Script para verificar que la migración 131 se aplicó correctamente
-- Ejecuta esto DESPUÉS de aplicar la migración

-- 1. Verificar que el índice único existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'availability_blocks'
        AND indexname = 'idx_availability_blocks_unique_external_event'
    )
    THEN '✅ Índice único creado correctamente'
    ELSE '❌ ERROR: Índice único NO existe'
  END as status;

-- 2. Verificar que NO hay duplicados
SELECT
  CASE
    WHEN COUNT(*) = 0
    THEN '✅ No hay duplicados en la base de datos'
    ELSE '❌ ERROR: Todavía hay ' || COUNT(*) || ' grupos de duplicados'
  END as status
FROM (
  SELECT
    google_calendar_event_id,
    start_date,
    COALESCE(start_time::text, 'full_day') as start_time,
    COALESCE(end_time::text, 'full_day') as end_time,
    COUNT(*) as count
  FROM availability_blocks
  WHERE is_external_event = true
    AND google_calendar_event_id IS NOT NULL
  GROUP BY
    google_calendar_event_id,
    start_date,
    COALESCE(start_time::text, 'full_day'),
    COALESCE(end_time::text, 'full_day')
  HAVING COUNT(*) > 1
) duplicates;

-- 3. Resumen post-migración
SELECT
  'Total de bloques externos después de limpieza' as metric,
  COUNT(*) as value
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- 4. Bloques por profesional después de limpieza
SELECT
  p.first_name || ' ' || p.last_name as professional_name,
  ab.professional_id,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT google_calendar_event_id) as unique_event_ids
FROM availability_blocks ab
LEFT JOIN professional_applications p ON ab.professional_id = p.id
WHERE ab.is_external_event = true
  AND ab.google_calendar_event_id IS NOT NULL
GROUP BY ab.professional_id, p.first_name, p.last_name
ORDER BY total_blocks DESC;

-- 5. Prueba del constraint único (debe fallar si intentamos crear un duplicado)
-- NO ejecutes esto si no quieres probar, es solo para verificar
-- Esto intentará crear un duplicado y debe fallar:
/*
DO $$
DECLARE
  test_block RECORD;
BEGIN
  -- Obtener un bloque existente
  SELECT * INTO test_block
  FROM availability_blocks
  WHERE is_external_event = true
    AND google_calendar_event_id IS NOT NULL
  LIMIT 1;

  IF test_block.id IS NOT NULL THEN
    -- Intentar crear un duplicado (esto DEBE fallar)
    BEGIN
      INSERT INTO availability_blocks (
        professional_id,
        user_id,
        block_type,
        start_date,
        start_time,
        end_time,
        title,
        is_recurring,
        is_external_event,
        external_event_source,
        google_calendar_event_id
      ) VALUES (
        test_block.professional_id,
        test_block.user_id,
        test_block.block_type,
        test_block.start_date,
        test_block.start_time,
        test_block.end_time,
        'TEST DUPLICATE',
        test_block.is_recurring,
        test_block.is_external_event,
        test_block.external_event_source,
        test_block.google_calendar_event_id
      );

      RAISE EXCEPTION '❌ ERROR: El constraint NO está funcionando, se permitió crear un duplicado';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE '✅ Constraint funcionando: Rechazó correctamente el duplicado';
    END;
  END IF;
END $$;
*/
