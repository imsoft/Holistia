-- Actualizar tabla professional_services para usar costo único en lugar de jsonb
-- La tabla ya existe con cost como jsonb, necesitamos convertirlo a NUMERIC

-- Crear columna temporal para el costo único
ALTER TABLE professional_services ADD COLUMN IF NOT EXISTS cost_temp NUMERIC(10, 2);

-- Migrar datos existentes desde el jsonb
-- Si el jsonb tiene estructura {presencial: X, online: Y}, usar presencial como base
UPDATE professional_services 
SET cost_temp = COALESCE(
  (cost->>'presencial')::NUMERIC,
  (cost->>'online')::NUMERIC,
  0
)
WHERE cost IS NOT NULL AND cost != '{}'::jsonb;

-- Si el jsonb tiene un valor directo, usarlo
UPDATE professional_services 
SET cost_temp = COALESCE(
  (cost->>'cost')::NUMERIC,
  cost_temp
)
WHERE cost IS NOT NULL AND cost != '{}'::jsonb;

-- Eliminar la columna jsonb antigua
ALTER TABLE professional_services DROP COLUMN IF EXISTS cost;

-- Renombrar la columna temporal
ALTER TABLE professional_services RENAME COLUMN cost_temp TO cost;

-- Hacer el campo cost requerido
ALTER TABLE professional_services ALTER COLUMN cost SET NOT NULL;

-- Actualizar comentarios
COMMENT ON COLUMN professional_services.cost IS 'Costo único del servicio en MXN';
COMMENT ON COLUMN professional_services.modality IS 'Modalidad: presencial, online o both';
