-- ============================================================================
-- MIGRACIÓN 180: Agregar slugs a entidades principales
-- ============================================================================
-- Fecha: 2026-01-16
-- Propósito: Agregar campo slug a eventos, retos, comercios, centros holísticos
--            y restaurantes para URLs amigables
-- 
-- El slug de profesionales y usuarios será su username (de profiles)
-- ============================================================================

-- ============================================================================
-- FUNCIÓN HELPER: Generar slug desde un texto
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convertir a minúsculas
  slug := LOWER(input_text);
  
  -- Reemplazar caracteres acentuados
  slug := TRANSLATE(slug, 
    'áàâäãåéèêëíìîïóòôöõúùûüñç',
    'aaaaaaeeeeiiiiooooouuuunc');
  
  -- Reemplazar espacios y caracteres especiales con guiones
  slug := REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g');
  
  -- Eliminar guiones al inicio y al final
  slug := TRIM(BOTH '-' FROM slug);
  
  -- Limitar longitud a 100 caracteres
  slug := LEFT(slug, 100);
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_slug IS 'Genera un slug URL-friendly desde un texto dado';

-- ============================================================================
-- 1. AGREGAR SLUG A PROFESSIONAL_APPLICATIONS
-- ============================================================================

-- Agregar columna slug si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_applications' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.professional_applications ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Crear índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_professional_applications_slug 
ON public.professional_applications(slug) WHERE slug IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.professional_applications.slug IS 
'Slug único del profesional para URLs amigables. Debe coincidir con el username del profile asociado.';

-- ============================================================================
-- 2. AGREGAR SLUG A EVENTS_WORKSHOPS
-- ============================================================================

-- Agregar columna slug si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events_workshops' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.events_workshops ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Crear índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_workshops_slug 
ON public.events_workshops(slug) WHERE slug IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.events_workshops.slug IS 
'Slug único del evento/taller para URLs amigables';

-- ============================================================================
-- 3. AGREGAR SLUG A CHALLENGES (Programas/Retos)
-- ============================================================================

-- Agregar columna slug si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.challenges ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Crear índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_slug 
ON public.challenges(slug) WHERE slug IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.challenges.slug IS 
'Slug único del reto/programa para URLs amigables';

-- ============================================================================
-- 4. AGREGAR SLUG A SHOPS (Comercios)
-- ============================================================================

-- Agregar columna slug si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Crear índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_slug 
ON public.shops(slug) WHERE slug IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.shops.slug IS 
'Slug único del comercio para URLs amigables';

-- ============================================================================
-- 5. AGREGAR SLUG A HOLISTIC_CENTERS
-- ============================================================================

-- Agregar columna slug si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'holistic_centers' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.holistic_centers ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Crear índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_holistic_centers_slug 
ON public.holistic_centers(slug) WHERE slug IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.holistic_centers.slug IS 
'Slug único del centro holístico para URLs amigables';

-- ============================================================================
-- 6. AGREGAR SLUG A RESTAURANTS
-- ============================================================================

-- Agregar columna slug si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Crear índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_slug 
ON public.restaurants(slug) WHERE slug IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.restaurants.slug IS 
'Slug único del restaurante para URLs amigables';

-- ============================================================================
-- 7. FUNCIÓN PARA GENERAR SLUG ÚNICO
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_unique_slug(
  base_slug TEXT,
  table_name TEXT,
  exclude_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  final_slug := base_slug;
  
  LOOP
    -- Verificar si el slug ya existe
    EXECUTE format(
      'SELECT EXISTS(SELECT 1 FROM public.%I WHERE slug = $1 AND ($2 IS NULL OR id != $2))',
      table_name
    ) INTO slug_exists USING final_slug, exclude_id;
    
    IF NOT slug_exists THEN
      RETURN final_slug;
    END IF;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
    
    -- Prevenir bucle infinito
    IF counter > 1000 THEN
      RETURN base_slug || '-' || gen_random_uuid()::TEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_unique_slug IS 
'Genera un slug único para una tabla específica, agregando sufijo numérico si es necesario';

-- ============================================================================
-- 8. TRIGGERS PARA AUTO-GENERAR SLUGS EN INSERT/UPDATE
-- ============================================================================

-- Trigger function para events_workshops
CREATE OR REPLACE FUNCTION set_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar slug si no se proporcionó uno o si el nombre cambió
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_unique_slug(
      generate_slug(NEW.name),
      'events_workshops',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_event_slug ON public.events_workshops;
CREATE TRIGGER trigger_set_event_slug
  BEFORE INSERT OR UPDATE ON public.events_workshops
  FOR EACH ROW
  EXECUTE FUNCTION set_event_slug();

-- Trigger function para challenges
CREATE OR REPLACE FUNCTION set_challenge_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_unique_slug(
      generate_slug(NEW.title),
      'challenges',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_challenge_slug ON public.challenges;
CREATE TRIGGER trigger_set_challenge_slug
  BEFORE INSERT OR UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION set_challenge_slug();

-- Trigger function para shops
CREATE OR REPLACE FUNCTION set_shop_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_unique_slug(
      generate_slug(NEW.name),
      'shops',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_shop_slug ON public.shops;
CREATE TRIGGER trigger_set_shop_slug
  BEFORE INSERT OR UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION set_shop_slug();

-- Trigger function para holistic_centers
CREATE OR REPLACE FUNCTION set_holistic_center_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_unique_slug(
      generate_slug(NEW.name),
      'holistic_centers',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_holistic_center_slug ON public.holistic_centers;
CREATE TRIGGER trigger_set_holistic_center_slug
  BEFORE INSERT OR UPDATE ON public.holistic_centers
  FOR EACH ROW
  EXECUTE FUNCTION set_holistic_center_slug();

-- Trigger function para restaurants
CREATE OR REPLACE FUNCTION set_restaurant_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_unique_slug(
      generate_slug(NEW.name),
      'restaurants',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_restaurant_slug ON public.restaurants;
CREATE TRIGGER trigger_set_restaurant_slug
  BEFORE INSERT OR UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION set_restaurant_slug();

-- ============================================================================
-- 9. SINCRONIZAR SLUG DE PROFESSIONAL_APPLICATIONS CON USERNAME DE PROFILES
-- ============================================================================

-- Trigger para sincronizar el slug del profesional con el username del profile
CREATE OR REPLACE FUNCTION sync_professional_slug_with_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza el username en profiles, actualizar el slug en professional_applications
  IF NEW.username IS NOT NULL AND NEW.username != '' THEN
    UPDATE public.professional_applications
    SET slug = NEW.username
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_professional_slug ON public.profiles;
CREATE TRIGGER trigger_sync_professional_slug
  AFTER UPDATE OF username ON public.profiles
  FOR EACH ROW
  WHEN (NEW.username IS DISTINCT FROM OLD.username)
  EXECUTE FUNCTION sync_professional_slug_with_username();

-- Trigger para establecer slug inicial cuando se aprueba un profesional
CREATE OR REPLACE FUNCTION set_initial_professional_slug()
RETURNS TRIGGER AS $$
DECLARE
  profile_username TEXT;
BEGIN
  -- Si el slug ya está establecido, no hacer nada
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;
  
  -- Obtener el username del profile asociado
  SELECT username INTO profile_username
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Si tiene username, usar eso como slug
  IF profile_username IS NOT NULL AND profile_username != '' THEN
    NEW.slug := profile_username;
  ELSE
    -- Si no tiene username, generar uno basado en nombre
    NEW.slug := generate_unique_slug(
      generate_slug(CONCAT(NEW.first_name, '-', NEW.last_name)),
      'professional_applications',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_professional_slug ON public.professional_applications;
CREATE TRIGGER trigger_set_professional_slug
  BEFORE INSERT OR UPDATE ON public.professional_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_professional_slug();

-- ============================================================================
-- 10. POBLAR SLUGS PARA REGISTROS EXISTENTES
-- ============================================================================

-- Generar slugs para eventos existentes que no tengan
UPDATE public.events_workshops
SET slug = generate_unique_slug(generate_slug(name), 'events_workshops', id)
WHERE slug IS NULL;

-- Generar slugs para retos existentes que no tengan
UPDATE public.challenges
SET slug = generate_unique_slug(generate_slug(title), 'challenges', id)
WHERE slug IS NULL;

-- Generar slugs para comercios existentes que no tengan
UPDATE public.shops
SET slug = generate_unique_slug(generate_slug(name), 'shops', id)
WHERE slug IS NULL;

-- Generar slugs para centros holísticos existentes que no tengan
UPDATE public.holistic_centers
SET slug = generate_unique_slug(generate_slug(name), 'holistic_centers', id)
WHERE slug IS NULL;

-- Generar slugs para restaurantes existentes que no tengan
UPDATE public.restaurants
SET slug = generate_unique_slug(generate_slug(name), 'restaurants', id)
WHERE slug IS NULL;

-- Sincronizar slugs de profesionales con usernames
UPDATE public.professional_applications pa
SET slug = p.username
FROM public.profiles p
WHERE pa.user_id = p.id
AND p.username IS NOT NULL
AND p.username != ''
AND (pa.slug IS NULL OR pa.slug = '');

-- Para profesionales sin username, generar slug basado en nombre
UPDATE public.professional_applications
SET slug = generate_unique_slug(
  generate_slug(CONCAT(first_name, '-', last_name)),
  'professional_applications',
  id
)
WHERE slug IS NULL OR slug = '';

-- ============================================================================
-- 11. VERIFICACIÓN
-- ============================================================================

SELECT 
  '✅ VERIFICACIÓN SLUGS' as resultado,
  'events_workshops con slug' as tabla,
  COUNT(*) FILTER (WHERE slug IS NOT NULL)::text as con_slug,
  COUNT(*) FILTER (WHERE slug IS NULL)::text as sin_slug
FROM public.events_workshops

UNION ALL

SELECT 
  '✅ VERIFICACIÓN SLUGS',
  'challenges con slug',
  COUNT(*) FILTER (WHERE slug IS NOT NULL)::text,
  COUNT(*) FILTER (WHERE slug IS NULL)::text
FROM public.challenges

UNION ALL

SELECT 
  '✅ VERIFICACIÓN SLUGS',
  'shops con slug',
  COUNT(*) FILTER (WHERE slug IS NOT NULL)::text,
  COUNT(*) FILTER (WHERE slug IS NULL)::text
FROM public.shops

UNION ALL

SELECT 
  '✅ VERIFICACIÓN SLUGS',
  'holistic_centers con slug',
  COUNT(*) FILTER (WHERE slug IS NOT NULL)::text,
  COUNT(*) FILTER (WHERE slug IS NULL)::text
FROM public.holistic_centers

UNION ALL

SELECT 
  '✅ VERIFICACIÓN SLUGS',
  'restaurants con slug',
  COUNT(*) FILTER (WHERE slug IS NOT NULL)::text,
  COUNT(*) FILTER (WHERE slug IS NULL)::text
FROM public.restaurants

UNION ALL

SELECT 
  '✅ VERIFICACIÓN SLUGS',
  'professional_applications con slug',
  COUNT(*) FILTER (WHERE slug IS NOT NULL)::text,
  COUNT(*) FILTER (WHERE slug IS NULL)::text
FROM public.professional_applications;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
-- Resumen:
-- - Se agregó campo slug a: events_workshops, challenges, shops, 
--   holistic_centers, restaurants, professional_applications
-- - Los slugs se generan automáticamente desde el nombre/título
-- - El slug de profesionales se sincroniza con el username de profiles
-- - Se crearon triggers para mantener los slugs actualizados
-- - Se poblaron los slugs para registros existentes
-- ============================================================================
