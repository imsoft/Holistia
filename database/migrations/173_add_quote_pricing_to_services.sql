-- ============================================================================
-- MIGRACIÓN 173: Agregar opción de cotización a servicios profesionales
-- ============================================================================
-- Descripción: Agrega campo pricing_type para permitir servicios con precio fijo o cotización
-- ============================================================================

-- Agregar campo pricing_type a professional_services
ALTER TABLE professional_services
ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'quote'));

-- Hacer el costo opcional (nullable) cuando pricing_type es 'quote'
-- Primero, permitir que cost sea NULL
ALTER TABLE professional_services
ALTER COLUMN cost DROP NOT NULL;

-- Agregar constraint para validar que si pricing_type es 'fixed', cost debe ser NOT NULL
-- Esto se hará a nivel de aplicación, pero también agregamos un comentario
COMMENT ON COLUMN professional_services.pricing_type IS 'Tipo de precio: fixed (precio fijo) o quote (cotización)';
COMMENT ON COLUMN professional_services.cost IS 'Costo del servicio. NULL si pricing_type es quote, requerido si es fixed';

-- Crear función para validar la lógica de pricing_type y cost
CREATE OR REPLACE FUNCTION validate_service_pricing()
RETURNS TRIGGER AS $$
BEGIN
  -- Si pricing_type es 'fixed', cost debe ser NOT NULL y > 0
  IF NEW.pricing_type = 'fixed' THEN
    IF NEW.cost IS NULL OR NEW.cost <= 0 THEN
      RAISE EXCEPTION 'El costo es requerido y debe ser mayor a 0 cuando el tipo de precio es "fixed"';
    END IF;
  END IF;
  
  -- Si pricing_type es 'quote', cost debe ser NULL
  IF NEW.pricing_type = 'quote' THEN
    IF NEW.cost IS NOT NULL THEN
      NEW.cost := NULL; -- Forzar NULL si se proporciona un costo en servicios de cotización
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validar antes de insertar o actualizar
DROP TRIGGER IF EXISTS validate_service_pricing_trigger ON professional_services;
CREATE TRIGGER validate_service_pricing_trigger
  BEFORE INSERT OR UPDATE ON professional_services
  FOR EACH ROW
  EXECUTE FUNCTION validate_service_pricing();

-- Actualizar servicios existentes para que tengan pricing_type = 'fixed' por defecto
UPDATE professional_services
SET pricing_type = 'fixed'
WHERE pricing_type IS NULL;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
