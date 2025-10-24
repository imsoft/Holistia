-- Migración para agregar fecha y hora de finalización a eventos
-- Fecha: 2025-10-24
-- 
-- OBJETIVO: Permitir que los eventos tengan fecha y hora de finalización explícitas
-- en lugar de solo duración
-- 
-- CAMBIOS:
-- 1. Agregar columna end_date para la fecha de finalización
-- 2. Agregar columna end_time para la hora de finalización
-- 3. Ambos campos son opcionales para mantener compatibilidad con eventos existentes

-- Agregar columna end_date (fecha de finalización)
ALTER TABLE events_workshops 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Agregar columna end_time (hora de finalización)
ALTER TABLE events_workshops 
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Agregar comentarios para documentación
COMMENT ON COLUMN events_workshops.end_date IS 'Fecha de finalización del evento (opcional). Si no se especifica, se calcula a partir de event_date + duration_hours';
COMMENT ON COLUMN events_workshops.end_time IS 'Hora de finalización del evento (opcional). Si no se especifica, se calcula a partir de event_time + duration_hours';

-- Nota: Los campos son opcionales para mantener compatibilidad con eventos existentes
-- Los eventos existentes seguirán usando solo duration_hours
-- Los nuevos eventos pueden especificar end_date y end_time directamente

