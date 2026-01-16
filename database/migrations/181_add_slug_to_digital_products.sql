-- =====================================================
-- MIGRACIÓN: Agregar slug a digital_products
-- Fecha: 2026-01-16
-- Descripción: Agrega columna slug a productos digitales
--              para URLs amigables (ej: /explore/program/meditacion-guiada)
-- =====================================================

-- 1. Agregar columna slug a digital_products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'digital_products' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.digital_products ADD COLUMN slug TEXT;
  END IF;
END $$;

-- 2. Crear índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_products_slug 
ON public.digital_products(slug) 
WHERE slug IS NOT NULL;

-- 3. Función para generar slug único para productos digitales
CREATE OR REPLACE FUNCTION generate_unique_digital_product_slug(
  base_slug TEXT,
  exclude_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  new_slug TEXT := base_slug;
  counter INTEGER := 1;
  slug_exists BOOLEAN;
BEGIN
  LOOP
    IF exclude_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.digital_products 
        WHERE slug = new_slug AND id != exclude_id
      ) INTO slug_exists;
    ELSE
      SELECT EXISTS(
        SELECT 1 FROM public.digital_products 
        WHERE slug = new_slug
      ) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- 4. Función trigger para generar slug automáticamente
CREATE OR REPLACE FUNCTION set_digital_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar slug si no existe o si el título cambió
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_unique_digital_product_slug(
      generate_slug(NEW.title),
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger
DROP TRIGGER IF EXISTS set_digital_product_slug_trigger ON public.digital_products;
CREATE TRIGGER set_digital_product_slug_trigger
BEFORE INSERT OR UPDATE ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION set_digital_product_slug();

-- 6. Poblar slugs para productos existentes que no tienen
UPDATE public.digital_products
SET slug = generate_unique_digital_product_slug(generate_slug(title), id)
WHERE slug IS NULL;

-- 7. Verificación
SELECT 
  '✅ VERIFICACIÓN SLUGS' as resultado,
  'digital_products con slug' as tabla,
  COUNT(*) FILTER (WHERE slug IS NOT NULL)::text as con_slug,
  COUNT(*) FILTER (WHERE slug IS NULL)::text as sin_slug
FROM public.digital_products;
