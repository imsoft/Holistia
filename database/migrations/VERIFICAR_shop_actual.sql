-- Verificar el estado actual del comercio con problema
SELECT
  id,
  name,
  image_url,
  gallery,
  is_active,
  CASE
    WHEN image_url IS NOT NULL THEN '✅ Tiene image_url'
    ELSE '❌ No tiene image_url'
  END as tiene_imagen,
  CASE
    WHEN gallery IS NOT NULL AND array_length(gallery, 1) > 0
    THEN '✅ Tiene galería con ' || array_length(gallery, 1)::text || ' imágenes'
    ELSE '❌ No tiene galería'
  END as tiene_galeria
FROM shops
WHERE id = '28f4ae55-a2f2-4c58-b114-2486b3ee900c';

-- Ver todos los shops activos y sus imágenes
SELECT
  id,
  name,
  image_url,
  array_length(gallery, 1) as num_imagenes_galeria,
  is_active
FROM shops
WHERE is_active = true
ORDER BY created_at DESC;
