-- =====================================================
-- MIGRACIÓN: Limpieza automática de imágenes del storage
-- =====================================================
-- Crea funciones y triggers para eliminar automáticamente
-- las imágenes del storage cuando se borran restaurantes
-- o centros holísticos
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN PARA LIMPIAR IMÁGENES DE RESTAURANTES
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_restaurant_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar todas las imágenes del restaurante cuando se elimina
  -- Estructura: restaurants/<restaurant-id>/imagen.{ext}
  DELETE FROM storage.objects 
  WHERE bucket_id = 'restaurants' 
  AND name LIKE OLD.id::text || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNCIÓN PARA LIMPIAR IMÁGENES DE CENTROS HOLÍSTICOS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_holistic_center_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar todas las imágenes del centro holístico cuando se elimina
  -- Estructura: holistic-centers/<center-id>/imagen.{ext}
  DELETE FROM storage.objects 
  WHERE bucket_id = 'holistic-centers' 
  AND name LIKE OLD.id::text || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TRIGGER PARA RESTAURANTES
-- =====================================================

-- Eliminar trigger existente si existe (para permitir re-ejecución)
DROP TRIGGER IF EXISTS cleanup_restaurant_images_trigger ON public.restaurants;

-- Crear trigger que se ejecuta después de eliminar un restaurante
CREATE TRIGGER cleanup_restaurant_images_trigger
  AFTER DELETE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_restaurant_images();

-- =====================================================
-- 4. TRIGGER PARA CENTROS HOLÍSTICOS
-- =====================================================

-- Eliminar trigger existente si existe (para permitir re-ejecución)
DROP TRIGGER IF EXISTS cleanup_holistic_center_images_trigger ON public.holistic_centers;

-- Crear trigger que se ejecuta después de eliminar un centro holístico
CREATE TRIGGER cleanup_holistic_center_images_trigger
  AFTER DELETE ON public.holistic_centers
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_holistic_center_images();

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION cleanup_restaurant_images() IS 
'Función que elimina automáticamente todas las imágenes del storage cuando se elimina un restaurante. Elimina archivos en restaurants/<restaurant-id>/*';

COMMENT ON FUNCTION cleanup_holistic_center_images() IS 
'Función que elimina automáticamente todas las imágenes del storage cuando se elimina un centro holístico. Elimina archivos en holistic-centers/<center-id>/*';

-- =====================================================
-- NOTAS:
-- =====================================================
-- - Los triggers se ejecutan automáticamente después de DELETE
-- - Eliminan todas las imágenes en la carpeta del restaurante/centro
-- - Si el bucket no existe o hay problemas de permisos, la operación fallará silenciosamente
--   (pero esto es esperado ya que las imágenes deben eliminarse si el bucket existe)
-- =====================================================
