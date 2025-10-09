-- =====================================================
-- VERIFICAR Y LIMPIAR EVENTOS DUPLICADOS
-- =====================================================
-- Este script te ayudará a identificar y eliminar eventos duplicados

-- 1. VERIFICAR SI HAY EVENTOS DUPLICADOS
-- Ejecuta primero esta query para ver si hay eventos duplicados
SELECT 
    name,
    event_date,
    event_time,
    location,
    COUNT(*) as cantidad_duplicados,
    array_agg(id) as ids_duplicados
FROM events_workshops
GROUP BY name, event_date, event_time, location
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- 2. VER TODOS LOS EVENTOS (para revisar manualmente)
SELECT 
    id,
    name,
    event_date,
    event_time,
    location,
    category,
    price,
    is_active,
    created_at
FROM events_workshops
ORDER BY name, event_date, created_at;

-- 3. ELIMINAR DUPLICADOS (conservando solo el más reciente)
-- IMPORTANTE: Revisa primero los resultados de las queries anteriores
-- antes de ejecutar esta eliminación

-- Esta CTE identifica qué registros mantener (los más recientes de cada grupo)
WITH eventos_unicos AS (
    SELECT DISTINCT ON (name, event_date, event_time, location)
        id,
        name,
        event_date,
        event_time,
        location,
        created_at
    FROM events_workshops
    ORDER BY name, event_date, event_time, location, created_at DESC
),
eventos_a_eliminar AS (
    SELECT e.id
    FROM events_workshops e
    WHERE e.id NOT IN (SELECT id FROM eventos_unicos)
)
-- Muestra primero los eventos que se eliminarían (ejecuta esto primero para verificar)
SELECT 
    e.*,
    'SERÁ ELIMINADO' as nota
FROM events_workshops e
WHERE e.id IN (SELECT id FROM eventos_a_eliminar)
ORDER BY e.name, e.created_at;

-- 4. EJECUTAR LA ELIMINACIÓN (solo después de verificar el paso 3)
-- Descomenta las siguientes líneas cuando estés seguro de que quieres eliminar los duplicados
/*
WITH eventos_unicos AS (
    SELECT DISTINCT ON (name, event_date, event_time, location)
        id
    FROM events_workshops
    ORDER BY name, event_date, event_time, location, created_at DESC
)
DELETE FROM events_workshops
WHERE id NOT IN (SELECT id FROM eventos_unicos);
*/

-- 5. VERIFICAR EL RESULTADO (ejecuta después de la eliminación)
/*
SELECT 
    'Total de eventos después de limpieza:' as descripcion,
    COUNT(*) as cantidad
FROM events_workshops;
*/

