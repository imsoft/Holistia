-- =====================================================
-- MIGRACIÓN: Agregar campo para menú en PDF
-- =====================================================
-- Permite a los restaurantes subir su menú completo en PDF
-- como alternativa a agregar platillos individualmente
-- =====================================================

-- 1. Agregar columna menu_pdf_url a la tabla restaurants
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS menu_pdf_url TEXT;

-- 2. Comentario para documentación
COMMENT ON COLUMN public.restaurants.menu_pdf_url IS 'URL del menú completo en formato PDF (alternativa a agregar platillos individuales)';

-- 3. Agregar columna catalog_pdf_url a la tabla shops
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS catalog_pdf_url TEXT;

-- 4. Comentario para documentación
COMMENT ON COLUMN public.shops.catalog_pdf_url IS 'URL del catálogo completo en formato PDF (alternativa a agregar productos individuales)';

-- 5. Actualizar bucket restaurants para soportar PDFs
DO $$
BEGIN
    -- Actualizar allowed_mime_types para incluir PDFs
    UPDATE storage.buckets
    SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
        file_size_limit = 10485760  -- 10MB para PDFs
    WHERE id = 'restaurants';

    IF NOT FOUND THEN
        -- Si el bucket no existe, crearlo
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'restaurants',
            'restaurants',
            true,
            10485760, -- 10MB
            ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
        );
    END IF;
END $$;

-- 6. Actualizar bucket shops para soportar PDFs
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    file_size_limit = 10485760  -- 10MB para PDFs
WHERE id = 'shops';

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO EN BUCKETS:
-- =====================================================
-- restaurants/<restaurant-id>/menu.pdf              # Menú completo en PDF
-- restaurants/<restaurant-id>/imagen.jpg            # Imagen principal
-- restaurants/<restaurant-id>/menu-images/*         # Imágenes de platillos
--
-- shops/<shop-id>/catalog.pdf                       # Catálogo completo en PDF
-- shops/<shop-id>/imagen.jpg                        # Imagen principal
-- shops/<shop-id>/products/*                        # Imágenes de productos
-- =====================================================
