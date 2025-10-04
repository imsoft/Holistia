-- Actualizar tabla professional_services para usar un solo campo de costo
-- en lugar de presencial_cost y online_cost separados

-- Agregar nueva columna cost
ALTER TABLE professional_services ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2);

-- Migrar datos existentes (si los hay)
-- Si hay datos en presencial_cost, usarlo como costo base
UPDATE professional_services 
SET cost = presencial_cost 
WHERE cost IS NULL AND presencial_cost IS NOT NULL;

-- Si no hay presencial_cost pero sí online_cost, usar online_cost
UPDATE professional_services 
SET cost = online_cost 
WHERE cost IS NULL AND online_cost IS NOT NULL;

-- Si hay ambos, usar el promedio (o presencial como prioridad)
UPDATE professional_services 
SET cost = presencial_cost 
WHERE cost IS NULL AND presencial_cost IS NOT NULL AND online_cost IS NOT NULL;

-- Hacer el campo cost requerido
ALTER TABLE professional_services ALTER COLUMN cost SET NOT NULL;

-- Eliminar las columnas antiguas
ALTER TABLE professional_services DROP COLUMN IF EXISTS presencial_cost;
ALTER TABLE professional_services DROP COLUMN IF EXISTS online_cost;

-- Actualizar comentarios
COMMENT ON COLUMN professional_services.cost IS 'Costo único del servicio en MXN';
COMMENT ON COLUMN professional_services.modality IS 'Modalidad: presencial, online o both';
