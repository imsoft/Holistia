-- Crear tabla de centros holísticos
CREATE TABLE IF NOT EXISTS public.holistic_centers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    image_url TEXT,
    opening_hours TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de restaurantes
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    image_url TEXT,
    cuisine_type TEXT,
    price_range TEXT,
    opening_hours TEXT,
    rating DECIMAL(3,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.holistic_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Políticas para holistic_centers

-- Los administradores pueden ver, crear, actualizar y eliminar
CREATE POLICY "Admins can do everything on holistic_centers"
ON public.holistic_centers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver centros activos (para futura página pública)
CREATE POLICY "Everyone can view active holistic_centers"
ON public.holistic_centers
FOR SELECT
TO authenticated
USING (is_active = true);

-- Políticas para restaurants

-- Los administradores pueden ver, crear, actualizar y eliminar
CREATE POLICY "Admins can do everything on restaurants"
ON public.restaurants
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Todos pueden ver restaurantes activos (para futura página pública)
CREATE POLICY "Everyone can view active restaurants"
ON public.restaurants
FOR SELECT
TO authenticated
USING (is_active = true);

-- Triggers para actualizar updated_at automáticamente

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para holistic_centers
CREATE TRIGGER set_holistic_centers_updated_at
    BEFORE UPDATE ON public.holistic_centers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para restaurants
CREATE TRIGGER set_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar el rendimiento

-- Índices para holistic_centers
CREATE INDEX IF NOT EXISTS idx_holistic_centers_is_active ON public.holistic_centers(is_active);
CREATE INDEX IF NOT EXISTS idx_holistic_centers_created_at ON public.holistic_centers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_holistic_centers_name ON public.holistic_centers(name);

-- Índices para restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at ON public.restaurants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON public.restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type ON public.restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range ON public.restaurants(price_range);

-- Comentarios para documentación
COMMENT ON TABLE public.holistic_centers IS 'Centros holísticos registrados en la plataforma';
COMMENT ON TABLE public.restaurants IS 'Restaurantes registrados en la plataforma';

COMMENT ON COLUMN public.holistic_centers.name IS 'Nombre del centro holístico';
COMMENT ON COLUMN public.holistic_centers.description IS 'Descripción del centro';
COMMENT ON COLUMN public.holistic_centers.address IS 'Dirección física';
COMMENT ON COLUMN public.holistic_centers.phone IS 'Número de teléfono';
COMMENT ON COLUMN public.holistic_centers.email IS 'Correo electrónico';
COMMENT ON COLUMN public.holistic_centers.website IS 'Sitio web';
COMMENT ON COLUMN public.holistic_centers.opening_hours IS 'Horario de atención';
COMMENT ON COLUMN public.holistic_centers.is_active IS 'Si el centro está activo en la plataforma';

COMMENT ON COLUMN public.restaurants.name IS 'Nombre del restaurante';
COMMENT ON COLUMN public.restaurants.description IS 'Descripción del restaurante';
COMMENT ON COLUMN public.restaurants.address IS 'Dirección física';
COMMENT ON COLUMN public.restaurants.phone IS 'Número de teléfono';
COMMENT ON COLUMN public.restaurants.email IS 'Correo electrónico';
COMMENT ON COLUMN public.restaurants.website IS 'Sitio web';
COMMENT ON COLUMN public.restaurants.cuisine_type IS 'Tipo de cocina (vegetariana, vegana, etc.)';
COMMENT ON COLUMN public.restaurants.price_range IS 'Rango de precios ($, $$, $$$, $$$$)';
COMMENT ON COLUMN public.restaurants.opening_hours IS 'Horario de atención';
COMMENT ON COLUMN public.restaurants.rating IS 'Calificación del restaurante (0-5)';
COMMENT ON COLUMN public.restaurants.is_active IS 'Si el restaurante está activo en la plataforma';
