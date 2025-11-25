-- =====================================================
-- MIGRACIÓN: Permitir a usuarios anónimos ver comercios activos
-- =====================================================
-- Agrega política RLS para que usuarios no autenticados
-- puedan ver comercios activos en la página principal
-- =====================================================

-- Política para que los usuarios no autenticados puedan ver comercios activos
CREATE POLICY "Public can view active shops"
ON public.shops
FOR SELECT
TO anon
USING (is_active = true);

-- También agregar política para usuarios anónimos en productos activos
CREATE POLICY "Public can view active products"
ON public.shop_products
FOR SELECT
TO anon
USING (
    is_active = true
    AND EXISTS (
        SELECT 1 FROM public.shops
        WHERE shops.id = shop_id
        AND shops.is_active = true
    )
);

-- Política para que usuarios anónimos puedan ver imágenes de productos activos
CREATE POLICY "Public can view product images"
ON public.shop_product_images
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.shop_products sp
        JOIN public.shops s ON s.id = sp.shop_id
        WHERE sp.id = product_id
        AND sp.is_active = true
        AND s.is_active = true
    )
);

