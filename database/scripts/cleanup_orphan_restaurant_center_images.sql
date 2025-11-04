-- =====================================================
-- SCRIPT: Limpiar imágenes huérfanas del storage
-- =====================================================
-- Este script elimina imágenes del storage que pertenecen
-- a restaurantes o centros holísticos que ya no existen
-- en las tablas
-- =====================================================
-- IMPORTANTE: Ejecuta este script solo si necesitas limpiar
-- imágenes que quedaron después de borrar registros ANTES
-- de aplicar la migración 103_cleanup_restaurant_center_images.sql
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICAR IMÁGENES HUÉRFANAS DE RESTAURANTES
-- =====================================================

-- Mostrar imágenes que no tienen un restaurante correspondiente
SELECT 
  'Restaurantes huérfanos' as tipo,
  o.name as file_path,
  o.id as storage_object_id,
  o.created_at as uploaded_at,
  (o.metadata->>'size')::bigint as file_size_bytes
FROM storage.objects o
WHERE o.bucket_id = 'restaurants'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.restaurants r
    WHERE o.name LIKE r.id::text || '/%'
  )
ORDER BY o.created_at DESC;

-- =====================================================
-- PASO 2: VERIFICAR IMÁGENES HUÉRFANAS DE CENTROS HOLÍSTICOS
-- =====================================================

-- Mostrar imágenes que no tienen un centro holístico correspondiente
SELECT 
  'Centros holísticos huérfanos' as tipo,
  o.name as file_path,
  o.id as storage_object_id,
  o.created_at as uploaded_at,
  (o.metadata->>'size')::bigint as file_size_bytes
FROM storage.objects o
WHERE o.bucket_id = 'holistic-centers'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.holistic_centers hc
    WHERE o.name LIKE hc.id::text || '/%'
  )
ORDER BY o.created_at DESC;

-- =====================================================
-- PASO 3: CONTAR IMÁGENES HUÉRFANAS
-- =====================================================

-- Contar imágenes huérfanas de restaurantes
SELECT 
  'Total imágenes huérfanas restaurantes' as tipo,
  COUNT(*) as cantidad,
  SUM((o.metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((o.metadata->>'size')::bigint)::numeric / 1024 / 1024, 2) as total_size_mb
FROM storage.objects o
WHERE o.bucket_id = 'restaurants'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.restaurants r
    WHERE o.name LIKE r.id::text || '/%'
  );

-- Contar imágenes huérfanas de centros holísticos
SELECT 
  'Total imágenes huérfanas centros' as tipo,
  COUNT(*) as cantidad,
  SUM((o.metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((o.metadata->>'size')::bigint)::numeric / 1024 / 1024, 2) as total_size_mb
FROM storage.objects o
WHERE o.bucket_id = 'holistic-centers'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.holistic_centers hc
    WHERE o.name LIKE hc.id::text || '/%'
  );

-- =====================================================
-- PASO 4: ELIMINAR IMÁGENES HUÉRFANAS DE RESTAURANTES
-- =====================================================
-- DESCOMENTA LAS SIGUIENTES LÍNEAS PARA EJECUTAR LA LIMPIEZA
-- =====================================================

/*
DELETE FROM storage.objects
WHERE bucket_id = 'restaurants'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.restaurants r
    WHERE storage.objects.name LIKE r.id::text || '/%'
  );
*/

-- =====================================================
-- PASO 5: ELIMINAR IMÁGENES HUÉRFANAS DE CENTROS HOLÍSTICOS
-- =====================================================
-- DESCOMENTA LAS SIGUIENTES LÍNEAS PARA EJECUTAR LA LIMPIEZA
-- =====================================================

/*
DELETE FROM storage.objects
WHERE bucket_id = 'holistic-centers'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.holistic_centers hc
    WHERE storage.objects.name LIKE hc.id::text || '/%'
  );
*/

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Primero ejecuta los PASOS 1, 2 y 3 para ver qué imágenes
--    se van a eliminar
-- 2. Revisa cuidadosamente los resultados
-- 3. Si estás seguro de que quieres eliminar las imágenes,
--    descomenta y ejecuta los PASOS 4 y 5
-- 4. Después de ejecutar la migración 103, este script
--    no debería ser necesario porque los triggers eliminarán
--    automáticamente las imágenes cuando se borren registros
-- =====================================================
