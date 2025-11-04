-- =====================================================
-- MIGRACIÓN: Crear tabla de menús de restaurantes
-- =====================================================
-- Crea la tabla restaurant_menus para que los restaurantes
-- puedan gestionar sus menús con título, descripción, 
-- precio y hasta 4 imágenes
-- =====================================================

-- 1. Crear tabla restaurant_menus
CREATE TABLE IF NOT EXISTS public.restaurant_menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    images JSONB DEFAULT '[]'::jsonb CHECK (jsonb_array_length(images) <= 4),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_restaurant_id 
ON public.restaurant_menus(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_menus_is_active 
ON public.restaurant_menus(is_active);

CREATE INDEX IF NOT EXISTS idx_restaurant_menus_display_order 
ON public.restaurant_menus(restaurant_id, display_order);

-- 3. Habilitar RLS
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on restaurant_menus"
ON public.restaurant_menus
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
        AND profiles.account_active = true
    )
);

-- Todos pueden ver menús activos de restaurantes activos
CREATE POLICY "Everyone can view active restaurant_menus"
ON public.restaurant_menus
FOR SELECT
TO authenticated
USING (
    is_active = true
    AND EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = restaurant_menus.restaurant_id
        AND restaurants.is_active = true
    )
);

-- 5. Trigger para actualizar updated_at
CREATE TRIGGER set_restaurant_menus_updated_at
    BEFORE UPDATE ON public.restaurant_menus
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Comentarios para documentación
COMMENT ON TABLE public.restaurant_menus IS 'Menús de los restaurantes con platos, precios e imágenes';
COMMENT ON COLUMN public.restaurant_menus.restaurant_id IS 'ID del restaurante al que pertenece el menú';
COMMENT ON COLUMN public.restaurant_menus.title IS 'Título del plato o elemento del menú';
COMMENT ON COLUMN public.restaurant_menus.description IS 'Descripción detallada del plato';
COMMENT ON COLUMN public.restaurant_menus.price IS 'Precio del plato (opcional)';
COMMENT ON COLUMN public.restaurant_menus.images IS 'Array JSON con URLs de hasta 4 imágenes del plato';
COMMENT ON COLUMN public.restaurant_menus.display_order IS 'Orden de visualización del menú';
COMMENT ON COLUMN public.restaurant_menus.is_active IS 'Si el menú está activo y visible';
