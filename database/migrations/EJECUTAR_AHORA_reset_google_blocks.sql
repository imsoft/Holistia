-- ⚠️ EJECUTAR ESTE SCRIPT PARA RESETEAR BLOQUES DE GOOGLE CALENDAR
-- Este script elimina TODOS los bloques externos de Google Calendar
-- para que puedan ser sincronizados nuevamente con las fechas correctas

-- Paso 1: Ver cuántos bloques se van a eliminar
SELECT
  'ANTES DE ELIMINAR' as momento,
  COUNT(*) as total_bloques_externos
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- Paso 2: Eliminar TODOS los bloques externos de Google Calendar
-- IMPORTANTE: Esto NO elimina bloques creados manualmente en Holistia
DELETE FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;

-- Paso 3: Verificar que se eliminaron
SELECT
  'DESPUES DE ELIMINAR' as momento,
  COUNT(*) as bloques_externos_restantes
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL;
-- Debe mostrar 0

-- Paso 4: Verificar que los bloques internos (creados en Holistia) siguen ahí
SELECT
  'BLOQUES INTERNOS (NO AFECTADOS)' as tipo,
  COUNT(*) as total
FROM availability_blocks
WHERE is_external_event = false
   OR google_calendar_event_id IS NULL;

-- ✅ SIGUIENTE PASO:
-- Después de ejecutar este script, ve a:
-- https://www.holistia.io/admin/[professional-id]/sync-tools
-- Y haz clic en "Forzar Sincronización"
--
-- Los eventos se sincronizarán nuevamente con las fechas correctas:
-- - Eventos de día completo tendrán start_date = end_date
-- - Eventos con hora tendrán end_date correctamente establecido
