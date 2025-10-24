-- Migración para agregar unidad de duración a eventos
-- Fecha: 2025-10-24
-- 
-- OBJETIVO: Permitir que los eventos puedan tener duración en horas o días
-- 
-- CAMBIOS:
-- 1. Agregar columna duration_unit para especificar si la duración es en 'hours' o 'days'
-- 2. Modificar el constraint de duration_hours para permitir valores más grandes (hasta 720 horas = 30 días)
-- 3. Agregar valor por defecto 'hours' para eventos existentes

-- Agregar columna duration_unit
ALTER TABLE events_workshops 
ADD COLUMN IF NOT EXISTS duration_unit VARCHAR(10) DEFAULT 'hours' CHECK (duration_unit IN ('hours', 'days'));

-- Modificar el constraint de duration_hours para permitir valores hasta 720 (30 días * 24 horas)
ALTER TABLE events_workshops 
DROP CONSTRAINT IF EXISTS events_workshops_duration_hours_check;

ALTER TABLE events_workshops 
ADD CONSTRAINT events_workshops_duration_hours_check CHECK (duration_hours > 0 AND duration_hours <= 720);

-- Agregar comentarios para documentación
COMMENT ON COLUMN events_workshops.duration_unit IS 'Unidad de duración: hours (horas) o days (días)';
COMMENT ON COLUMN events_workshops.duration_hours IS 'Duración del evento. Si duration_unit es days, este valor representa días convertidos a horas (ej: 2 días = 48 horas)';

-- Actualizar eventos existentes para que tengan la unidad 'hours'
UPDATE events_workshops 
SET duration_unit = 'hours' 
WHERE duration_unit IS NULL;

