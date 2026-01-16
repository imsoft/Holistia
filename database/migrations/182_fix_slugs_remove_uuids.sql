-- ============================================================================
-- MIGRACIÓN 182: Corregir slugs eliminando UUIDs
-- ============================================================================
-- Fecha: 2026-01-16
-- Propósito: Los slugs actuales incluyen el UUID al final (ej: "titulo-uuid").
--            Esta migración los regenera para que sean solo el nombre/título.
-- ============================================================================

-- ============================================================================
-- 1. LIMPIAR Y REGENERAR SLUGS DE EVENTS_WORKSHOPS
-- ============================================================================

-- Resetear todos los slugs para que el trigger los regenere correctamente
UPDATE public.events_workshops
SET slug = NULL;

-- Forzar que el trigger regenere el slug
UPDATE public.events_workshops
SET slug = generate_unique_slug(generate_slug(name), 'events_workshops', id)
WHERE slug IS NULL;

-- ============================================================================
-- 2. LIMPIAR Y REGENERAR SLUGS DE CHALLENGES
-- ============================================================================

UPDATE public.challenges
SET slug = NULL;

UPDATE public.challenges
SET slug = generate_unique_slug(generate_slug(title), 'challenges', id)
WHERE slug IS NULL;

-- ============================================================================
-- 3. LIMPIAR Y REGENERAR SLUGS DE SHOPS
-- ============================================================================

UPDATE public.shops
SET slug = NULL;

UPDATE public.shops
SET slug = generate_unique_slug(generate_slug(name), 'shops', id)
WHERE slug IS NULL;

-- ============================================================================
-- 4. LIMPIAR Y REGENERAR SLUGS DE HOLISTIC_CENTERS
-- ============================================================================

UPDATE public.holistic_centers
SET slug = NULL;

UPDATE public.holistic_centers
SET slug = generate_unique_slug(generate_slug(name), 'holistic_centers', id)
WHERE slug IS NULL;

-- ============================================================================
-- 5. LIMPIAR Y REGENERAR SLUGS DE RESTAURANTS
-- ============================================================================

UPDATE public.restaurants
SET slug = NULL;

UPDATE public.restaurants
SET slug = generate_unique_slug(generate_slug(name), 'restaurants', id)
WHERE slug IS NULL;

-- ============================================================================
-- 6. LIMPIAR Y REGENERAR SLUGS DE PROFESSIONAL_APPLICATIONS
-- ============================================================================

-- Primero, sincronizar con username del profile si existe
UPDATE public.professional_applications pa
SET slug = p.username
FROM public.profiles p
WHERE pa.user_id = p.id
AND p.username IS NOT NULL
AND p.username != '';

-- Para profesionales sin username, generar slug basado en nombre (sin UUID)
UPDATE public.professional_applications
SET slug = generate_unique_slug(
  generate_slug(CONCAT(first_name, '-', last_name)),
  'professional_applications',
  id
)
WHERE slug IS NULL OR slug = '' OR slug LIKE '%-%-%-%-%-%';

-- ============================================================================
-- 7. LIMPIAR Y REGENERAR SLUGS DE DIGITAL_PRODUCTS (si existe la columna)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'digital_products' 
    AND column_name = 'slug'
  ) THEN
    UPDATE public.digital_products
    SET slug = NULL;
    
    -- Usar la función específica para digital products si existe
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_unique_digital_product_slug') THEN
      UPDATE public.digital_products
      SET slug = generate_unique_digital_product_slug(generate_slug(title), id)
      WHERE slug IS NULL;
    ELSE
      -- Fallback: generar slug manualmente sin función específica
      UPDATE public.digital_products dp
      SET slug = (
        SELECT CASE 
          WHEN NOT EXISTS (SELECT 1 FROM public.digital_products WHERE slug = generate_slug(dp.title) AND id != dp.id)
          THEN generate_slug(dp.title)
          ELSE generate_slug(dp.title) || '-' || SUBSTRING(dp.id::text, 1, 4)
        END
      )
      WHERE slug IS NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 8. VERIFICACIÓN DE SLUGS LIMPIOS
-- ============================================================================

SELECT 
  '✅ VERIFICACIÓN SLUGS LIMPIOS' as resultado,
  'events_workshops' as tabla,
  slug as ejemplo_slug
FROM public.events_workshops
WHERE slug IS NOT NULL
LIMIT 3;

SELECT 
  '✅ VERIFICACIÓN SLUGS LIMPIOS' as resultado,
  'challenges' as tabla,
  slug as ejemplo_slug
FROM public.challenges
WHERE slug IS NOT NULL
LIMIT 3;

SELECT 
  '✅ VERIFICACIÓN SLUGS LIMPIOS' as resultado,
  'shops' as tabla,
  slug as ejemplo_slug
FROM public.shops
WHERE slug IS NOT NULL
LIMIT 3;

SELECT 
  '✅ VERIFICACIÓN SLUGS LIMPIOS' as resultado,
  'holistic_centers' as tabla,
  slug as ejemplo_slug
FROM public.holistic_centers
WHERE slug IS NOT NULL
LIMIT 3;

SELECT 
  '✅ VERIFICACIÓN SLUGS LIMPIOS' as resultado,
  'restaurants' as tabla,
  slug as ejemplo_slug
FROM public.restaurants
WHERE slug IS NOT NULL
LIMIT 3;

SELECT 
  '✅ VERIFICACIÓN SLUGS LIMPIOS' as resultado,
  'professional_applications' as tabla,
  slug as ejemplo_slug
FROM public.professional_applications
WHERE slug IS NOT NULL
LIMIT 3;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
-- Después de ejecutar esta migración, las URLs deberán verse así:
--   - /explore/event/taller-de-equinoyoga
--   - /explore/professional/yazmin-payan
--   - /explore/shop/tienda-natural
--   - /explore/holistic-center/centro-zen
--   - /explore/restaurant/restaurante-verde
--   - /explore/challenge/reto-meditacion
--   - /explore/program/meditacion-guiada
-- ============================================================================
