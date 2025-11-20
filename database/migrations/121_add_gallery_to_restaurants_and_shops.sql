-- =====================================================
-- MIGRACIÓN: Agregar campo gallery a restaurantes y comercios
-- =====================================================
-- Permite a restaurantes y comercios tener hasta 4 imágenes
-- adicionales en su galería además de la imagen principal
-- =====================================================

-- 1. Agregar columna gallery a la tabla restaurants
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Comentario para documentación
COMMENT ON COLUMN public.restaurants.gallery IS 'Array de URLs de imágenes de la galería (máximo 4 imágenes)';

-- 3. Agregar columna gallery a la tabla shops
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 4. Comentario para documentación
COMMENT ON COLUMN public.shops.gallery IS 'Array de URLs de imágenes de la galería (máximo 4 imágenes)';

-- 5. Asegurar que los buckets de storage existan y tengan las políticas correctas
-- Bucket restaurants ya existe (creado en migración 120)
-- Bucket shops ya existe (creado en migración 114)

-- 6. Políticas RLS para storage (si no existen ya)
-- Los administradores pueden subir imágenes a restaurantes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Admins can upload restaurant gallery images'
    ) THEN
        CREATE POLICY "Admins can upload restaurant gallery images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'restaurants' AND
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.type = 'admin'
            )
        );
    END IF;
END $$;

-- Los administradores pueden eliminar imágenes de restaurantes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Admins can delete restaurant gallery images'
    ) THEN
        CREATE POLICY "Admins can delete restaurant gallery images" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'restaurants' AND
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.type = 'admin'
            )
        );
    END IF;
END $$;

-- Todos pueden ver imágenes de restaurantes (públicas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Everyone can view restaurant images'
    ) THEN
        CREATE POLICY "Everyone can view restaurant images" ON storage.objects
        FOR SELECT USING (bucket_id = 'restaurants');
    END IF;
END $$;

-- Los administradores pueden subir imágenes a comercios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Admins can upload shop gallery images'
    ) THEN
        CREATE POLICY "Admins can upload shop gallery images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'shops' AND
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.type = 'admin'
            )
        );
    END IF;
END $$;

-- Los administradores pueden eliminar imágenes de comercios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Admins can delete shop gallery images'
    ) THEN
        CREATE POLICY "Admins can delete shop gallery images" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'shops' AND
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.type = 'admin'
            )
        );
    END IF;
END $$;

-- Todos pueden ver imágenes de comercios (públicas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Everyone can view shop images'
    ) THEN
        CREATE POLICY "Everyone can view shop images" ON storage.objects
        FOR SELECT USING (bucket_id = 'shops');
    END IF;
END $$;

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO EN BUCKETS:
-- =====================================================
-- restaurants/<restaurant-id>/imagen.jpg            # Imagen principal
-- restaurants/<restaurant-id>/gallery-*.jpg          # Imágenes de galería (máx 4)
-- restaurants/<restaurant-id>/menu.pdf               # Menú completo en PDF
-- restaurants/<restaurant-id>/menu-images/*          # Imágenes de platillos
--
-- shops/<shop-id>/imagen.jpg                         # Imagen principal
-- shops/<shop-id>/gallery-*.jpg                      # Imágenes de galería (máx 4)
-- shops/<shop-id>/catalog.pdf                        # Catálogo completo en PDF
-- shops/<shop-id>/products/*                         # Imágenes de productos
-- =====================================================

