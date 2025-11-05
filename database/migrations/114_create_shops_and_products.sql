-- =====================================================
-- MIGRACIÓN: Crear tablas de comercios y productos
-- =====================================================
-- Crea la estructura completa para gestionar comercios
-- y sus productos
-- =====================================================

-- 1. Crear tabla de comercios
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    image_url TEXT,
    opening_hours JSONB,
    category TEXT, -- 'ropa', 'joyeria', 'decoracion', 'artesanias', 'libros', 'cosmetica', 'otros'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de productos
CREATE TABLE IF NOT EXISTS public.shop_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    discount_price DECIMAL(10,2), -- precio con descuento (opcional)
    stock INTEGER DEFAULT 0,
    sku TEXT, -- código de producto
    category TEXT,
    is_featured BOOLEAN DEFAULT false, -- producto destacado
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: discount_price debe ser menor que price
    CONSTRAINT check_discount_price
        CHECK (discount_price IS NULL OR discount_price < price)
);

-- 3. Crear tabla de imágenes de productos
CREATE TABLE IF NOT EXISTS public.shop_product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_order INTEGER NOT NULL DEFAULT 0, -- Para mantener el orden (max 6 imágenes)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: máximo 6 imágenes por producto
    CONSTRAINT unique_product_order UNIQUE(product_id, image_order),
    CONSTRAINT check_image_order CHECK (image_order >= 0 AND image_order < 6)
);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_images ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para shops
-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on shops"
ON public.shops
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver comercios activos
CREATE POLICY "Everyone can view active shops"
ON public.shops
FOR SELECT
TO authenticated
USING (is_active = true);

-- 6. Políticas RLS para productos
-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on products"
ON public.shop_products
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver productos activos de comercios activos
CREATE POLICY "Everyone can view active products"
ON public.shop_products
FOR SELECT
TO authenticated
USING (
    is_active = true
    AND EXISTS (
        SELECT 1 FROM public.shops
        WHERE shops.id = shop_id
        AND shops.is_active = true
    )
);

-- 7. Políticas RLS para imágenes de productos
-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on product images"
ON public.shop_product_images
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver imágenes de productos activos
CREATE POLICY "Everyone can view product images"
ON public.shop_product_images
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.shop_products sp
        JOIN public.shops s ON s.id = sp.shop_id
        WHERE sp.id = product_id
        AND sp.is_active = true
        AND s.is_active = true
    )
);

-- 8. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_shops_city ON public.shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_category ON public.shops(category);
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON public.shops(is_active);

CREATE INDEX IF NOT EXISTS idx_shop_products_shop_id ON public.shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON public.shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_is_featured ON public.shop_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_shop_products_is_active ON public.shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_sku ON public.shop_products(sku);

CREATE INDEX IF NOT EXISTS idx_shop_product_images_product_id ON public.shop_product_images(product_id);

-- 9. Triggers para actualizar updated_at automáticamente
CREATE TRIGGER set_shops_updated_at
    BEFORE UPDATE ON public.shops
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_shop_products_updated_at
    BEFORE UPDATE ON public.shop_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 10. Comentarios para documentación
COMMENT ON TABLE public.shops IS 'Comercios registrados en la plataforma';
COMMENT ON TABLE public.shop_products IS 'Productos de los comercios';
COMMENT ON TABLE public.shop_product_images IS 'Imágenes de productos (máximo 6 por producto)';

COMMENT ON COLUMN public.shops.name IS 'Nombre del comercio';
COMMENT ON COLUMN public.shops.category IS 'Categoría del comercio';
COMMENT ON COLUMN public.shops.opening_hours IS 'Horarios de atención en formato JSON';

COMMENT ON COLUMN public.shop_products.name IS 'Nombre del producto';
COMMENT ON COLUMN public.shop_products.price IS 'Precio del producto';
COMMENT ON COLUMN public.shop_products.discount_price IS 'Precio con descuento (opcional)';
COMMENT ON COLUMN public.shop_products.stock IS 'Cantidad en inventario';
COMMENT ON COLUMN public.shop_products.sku IS 'Código único del producto';
COMMENT ON COLUMN public.shop_products.is_featured IS 'Producto destacado';

-- 11. Actualizar bucket shops para soportar imágenes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shops',
  'shops',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  file_size_limit = 5242880;

-- Políticas de storage para shops
DROP POLICY IF EXISTS "Public Access Shops" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload shops" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update shops" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete shops" ON storage.objects;

CREATE POLICY "Public Access Shops"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shops');

CREATE POLICY "Authenticated users can upload shops"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shops');

CREATE POLICY "Authenticated users can update shops"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shops')
WITH CHECK (bucket_id = 'shops');

CREATE POLICY "Authenticated users can delete shops"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shops');

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO EN BUCKET:
-- =====================================================
-- shops/<shop-id>/imagen.jpg                    # Imagen principal del comercio
-- shops/<shop-id>/products/<product-name>/image-0.jpg
-- shops/<shop-id>/products/<product-name>/image-1.jpg
-- ...hasta image-5.jpg
--
-- Ejemplo:
-- shops/abc-123/imagen.jpg
-- shops/abc-123/products/collar-plata/image-0.jpg
-- =====================================================
