-- =====================================================
-- MIGRACIÓN: Corregir image_url de shops
-- =====================================================
-- Este script verifica y corrige las URLs de imágenes
-- de los comercios que apuntan a archivos inexistentes
-- =====================================================

-- 1. Ver el comercio con problema
SELECT
  id,
  name,
  image_url,
  gallery,
  CASE
    WHEN image_url IS NOT NULL AND image_url LIKE '%imagen.PNG%'
    THEN '❌ URL apunta a archivo inexistente (imagen.PNG)'
    WHEN image_url IS NULL AND gallery IS NOT NULL AND array_length(gallery, 1) > 0
    THEN '⚠️ No hay image_url pero sí hay galería'
    WHEN image_url IS NOT NULL
    THEN '✅ Tiene image_url'
    ELSE '❌ No tiene imagen'
  END as status
FROM shops
WHERE id = '28f4ae55-a2f2-4c58-b114-2486b3ee900c';

-- 2. Opción A: Usar la primera imagen de la galería como imagen principal
-- Si el comercio tiene imágenes en gallery pero image_url está mal,
-- usar la primera imagen de la galería
UPDATE shops
SET image_url = gallery[1]
WHERE id = '28f4ae55-a2f2-4c58-b114-2486b3ee900c'
  AND (
    image_url IS NULL
    OR image_url LIKE '%imagen.PNG%'
  )
  AND gallery IS NOT NULL
  AND array_length(gallery, 1) > 0;

-- 3. Verificar que se corrigió
SELECT
  id,
  name,
  image_url,
  gallery,
  CASE
    WHEN image_url IS NOT NULL AND image_url LIKE '%gallery-%'
    THEN '✅ Ahora usa imagen de galería como principal'
    WHEN image_url IS NOT NULL
    THEN '✅ Tiene image_url válida'
    ELSE '❌ Aún no tiene imagen'
  END as status
FROM shops
WHERE id = '28f4ae55-a2f2-4c58-b114-2486b3ee900c';

-- 4. BONUS: Corregir TODOS los comercios con este problema
-- (no solo el que tiene el error)
SELECT
  COUNT(*) as total_shops_con_problema,
  'Comercios con image_url que apunta a imagen.PNG' as descripcion
FROM shops
WHERE image_url LIKE '%imagen.PNG%';

-- Actualizar todos los comercios que tengan este problema
UPDATE shops
SET image_url = gallery[1]
WHERE (
    image_url IS NULL
    OR image_url LIKE '%imagen.PNG%'
    OR image_url LIKE '%/imagen.%' -- cualquier variante de imagen.jpg, imagen.png, etc
  )
  AND gallery IS NOT NULL
  AND array_length(gallery, 1) > 0;

-- 5. Resumen final
SELECT
  COUNT(*) as total_shops,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as con_image_url,
  COUNT(CASE WHEN image_url IS NULL THEN 1 END) as sin_image_url,
  COUNT(CASE WHEN gallery IS NOT NULL AND array_length(gallery, 1) > 0 THEN 1 END) as con_galeria
FROM shops
WHERE is_active = true;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Los comercios que tenían image_url apuntando a archivos
-- inexistentes (como imagen.PNG) ahora usarán la primera
-- imagen de su galería como imagen principal
--
-- Esto resolverá el error 400 Bad Request
-- =====================================================
