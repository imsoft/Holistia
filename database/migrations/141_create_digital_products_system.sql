-- Migración 141: Sistema completo de productos digitales para profesionales verificados
-- Este sistema permite a profesionales verificados vender productos digitales como:
-- meditaciones, ebooks, manuales, cursos, etc.

-- ============================================================================
-- 1. TABLA DE PRODUCTOS DIGITALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.digital_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('meditation', 'ebook', 'manual', 'course', 'guide', 'audio', 'video', 'other')),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency TEXT DEFAULT 'MXN' NOT NULL,
    cover_image_url TEXT,
    file_url TEXT, -- URL del archivo digital (puede ser privado en storage)
    preview_url TEXT, -- URL de vista previa o muestra gratuita
    duration_minutes INTEGER, -- Para meditaciones, audios, videos
    pages_count INTEGER, -- Para ebooks, manuales
    file_size_mb DECIMAL(10, 2),
    file_format TEXT, -- PDF, MP3, MP4, ZIP, etc.
    tags TEXT[], -- Etiquetas para búsqueda
    is_active BOOLEAN DEFAULT true NOT NULL,
    sales_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

-- Políticas para digital_products
DROP POLICY IF EXISTS "Admins can do everything on digital_products" ON public.digital_products;
DROP POLICY IF EXISTS "Professionals can manage their own products" ON public.digital_products;
DROP POLICY IF EXISTS "Public can view active products from verified professionals" ON public.digital_products;

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on digital_products"
ON public.digital_products
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Los profesionales pueden gestionar sus propios productos
CREATE POLICY "Professionals can manage their own products"
ON public.digital_products
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE professional_applications.id = digital_products.professional_id
        AND professional_applications.user_id = auth.uid()
    )
);

-- Todos pueden ver productos activos de profesionales verificados
CREATE POLICY "Public can view active products from verified professionals"
ON public.digital_products
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    AND EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE professional_applications.id = digital_products.professional_id
        AND professional_applications.is_verified = true
        AND professional_applications.status = 'approved'
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_digital_products_professional_id ON public.digital_products(professional_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_category ON public.digital_products(category);
CREATE INDEX IF NOT EXISTS idx_digital_products_is_active ON public.digital_products(is_active);
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON public.digital_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_sales_count ON public.digital_products(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_tags ON public.digital_products USING GIN(tags);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_digital_products_updated_at ON public.digital_products;

CREATE TRIGGER set_digital_products_updated_at
    BEFORE UPDATE ON public.digital_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comentarios
COMMENT ON TABLE public.digital_products IS 'Productos digitales vendidos por profesionales verificados';
COMMENT ON COLUMN public.digital_products.category IS 'Tipo de producto: meditation, ebook, manual, course, guide, audio, video, other';
COMMENT ON COLUMN public.digital_products.file_url IS 'URL del archivo digital (puede ser privado en Supabase Storage)';
COMMENT ON COLUMN public.digital_products.preview_url IS 'URL de vista previa o muestra gratuita';

-- ============================================================================
-- 2. TABLA DE COMPRAS DE PRODUCTOS DIGITALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.digital_product_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')),
    access_granted BOOLEAN DEFAULT false NOT NULL,
    download_count INTEGER DEFAULT 0 NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    access_expires_at TIMESTAMP WITH TIME ZONE, -- Opcional: para productos con acceso temporal
    last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.digital_product_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas para digital_product_purchases
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.digital_product_purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.digital_product_purchases;
DROP POLICY IF EXISTS "Professionals can view purchases of their products" ON public.digital_product_purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON public.digital_product_purchases;

-- Los administradores pueden ver todas las compras
CREATE POLICY "Admins can view all purchases"
ON public.digital_product_purchases
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Los usuarios pueden ver sus propias compras
CREATE POLICY "Users can view their own purchases"
ON public.digital_product_purchases
FOR SELECT
TO authenticated
USING (buyer_id = auth.uid());

-- Los profesionales pueden ver compras de sus productos
CREATE POLICY "Professionals can view purchases of their products"
ON public.digital_product_purchases
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE professional_applications.id = digital_product_purchases.professional_id
        AND professional_applications.user_id = auth.uid()
    )
);

-- Los usuarios pueden crear compras (el sistema validará el pago)
CREATE POLICY "Users can create purchases"
ON public.digital_product_purchases
FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_product_id ON public.digital_product_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_buyer_id ON public.digital_product_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_professional_id ON public.digital_product_purchases(professional_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_payment_status ON public.digital_product_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_purchased_at ON public.digital_product_purchases(purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_stripe_payment_intent ON public.digital_product_purchases(stripe_payment_intent_id);

-- Índice único para evitar compras duplicadas accidentales
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_purchase_per_user_product
ON public.digital_product_purchases(buyer_id, product_id)
WHERE payment_status = 'succeeded';

-- Comentarios
COMMENT ON TABLE public.digital_product_purchases IS 'Registro de compras de productos digitales por usuarios';
COMMENT ON COLUMN public.digital_product_purchases.access_granted IS 'Si el usuario tiene acceso al producto (se activa tras pago exitoso)';
COMMENT ON COLUMN public.digital_product_purchases.download_count IS 'Número de veces que el usuario ha descargado el producto';

-- ============================================================================
-- 3. FUNCIÓN PARA INCREMENTAR CONTADOR DE VENTAS
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_product_sales_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo incrementar cuando el pago es exitoso y el acceso se otorga
    IF NEW.payment_status = 'succeeded' AND NEW.access_granted = true THEN
        UPDATE public.digital_products
        SET sales_count = sales_count + 1
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incrementar sales_count automáticamente
DROP TRIGGER IF EXISTS trigger_increment_sales_count ON public.digital_product_purchases;

CREATE TRIGGER trigger_increment_sales_count
    AFTER INSERT OR UPDATE OF payment_status, access_granted
    ON public.digital_product_purchases
    FOR EACH ROW
    EXECUTE FUNCTION increment_product_sales_count();

-- ============================================================================
-- 4. VISTA PARA PRODUCTOS CON INFORMACIÓN DEL PROFESIONAL
-- ============================================================================

CREATE OR REPLACE VIEW public.digital_products_with_professional AS
SELECT
    dp.*,
    pa.first_name as professional_first_name,
    pa.last_name as professional_last_name,
    pa.profile_photo as professional_photo,
    pa.profession as professional_profession,
    pa.is_verified as professional_is_verified
FROM public.digital_products dp
INNER JOIN public.professional_applications pa ON dp.professional_id = pa.id
WHERE dp.is_active = true
AND pa.is_verified = true
AND pa.status = 'approved';

COMMENT ON VIEW public.digital_products_with_professional IS 'Vista de productos digitales con información del profesional que los vende';

-- ============================================================================
-- 5. FUNCIÓN PARA INCREMENTAR CONTADOR DE DESCARGAS
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_download_count(p_product_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Incrementar el contador de descargas en la compra
    UPDATE public.digital_product_purchases
    SET
        download_count = download_count + 1,
        last_accessed_at = timezone('utc'::text, now())
    WHERE product_id = p_product_id
    AND buyer_id = p_user_id
    AND payment_status = 'succeeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_download_count IS 'Incrementa el contador de descargas cuando un usuario descarga un producto comprado';
