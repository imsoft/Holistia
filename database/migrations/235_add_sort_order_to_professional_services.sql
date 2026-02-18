-- Migración 235: Agregar campo sort_order a professional_services
-- Permite que los profesionales ordenen sus servicios mediante drag-and-drop

-- Agregar columna sort_order si no existe
ALTER TABLE professional_services
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Inicializar sort_order con el orden actual (por fecha de creación, por profesional)
-- Cada profesional tiene su propia secuencia de order empezando en 0
UPDATE professional_services ps
SET sort_order = sub.rn - 1
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY professional_id
           ORDER BY created_at ASC
         ) AS rn
  FROM professional_services
) sub
WHERE ps.id = sub.id
  AND ps.sort_order IS NULL;

-- Hacer la columna NOT NULL con default 0 después de inicializar
ALTER TABLE professional_services
  ALTER COLUMN sort_order SET DEFAULT 0;

-- Actualizar la función get_professional_services para ordenar por sort_order
-- Hay que hacer DROP primero porque cambia el tipo de retorno (agrega sort_order)
DROP FUNCTION IF EXISTS get_professional_services(UUID);

CREATE OR REPLACE FUNCTION get_professional_services(p_professional_id UUID)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  modality TEXT,
  duration INTEGER,
  isactive BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  cost NUMERIC,
  pricing_type TEXT,
  program_duration JSONB,
  image_url TEXT,
  sort_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.professional_id,
    ps.user_id,
    ps.name,
    ps.description,
    ps.type,
    ps.modality,
    ps.duration,
    ps.isactive,
    ps.created_at,
    ps.updated_at,
    ps.cost,
    ps.pricing_type,
    ps.program_duration,
    ps.image_url,
    ps.sort_order
  FROM professional_services ps
  INNER JOIN professional_applications pa ON ps.professional_id = pa.id
  WHERE ps.professional_id = p_professional_id
    AND ps.isactive = true
    AND pa.status = 'approved'
  ORDER BY ps.sort_order ASC NULLS LAST, ps.created_at ASC;
END;
$$;
