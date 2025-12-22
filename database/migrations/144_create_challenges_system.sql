-- Migración 144: Sistema completo de retos para profesionales
-- Permite a profesionales crear retos con contenido multimedia
-- Los usuarios pagan para acceder a los retos
-- Holistia recibe 20% de comisión, profesional recibe 80%

-- ============================================================================
-- 1. TABLA DE RETOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT, -- Descripción corta para cards
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency TEXT DEFAULT 'MXN' NOT NULL,
    cover_image_url TEXT, -- Imagen de portada
    duration_days INTEGER, -- Duración del reto en días
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    category TEXT, -- Categoría del reto (meditation, fitness, nutrition, etc.)
    is_active BOOLEAN DEFAULT true NOT NULL,
    sales_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. TABLA DE ARCHIVOS MULTIMEDIA DE RETOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- URL del archivo en Supabase Storage
    file_type TEXT NOT NULL CHECK (file_type IN ('audio', 'video', 'pdf', 'image', 'document', 'other')),
    file_size_mb DECIMAL(10, 2), -- Tamaño del archivo en MB
    display_order INTEGER DEFAULT 0, -- Orden de visualización
    description TEXT, -- Descripción opcional del archivo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.challenge_files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. TABLA DE COMPRAS/REGISTROS DE RETOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'MXN' NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')),
    access_granted BOOLEAN DEFAULT false NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE, -- Fecha en que el usuario comenzó el reto
    completed_at TIMESTAMP WITH TIME ZONE, -- Fecha en que el usuario completó el reto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Un usuario solo puede comprar un reto una vez
    CONSTRAINT challenge_purchases_unique UNIQUE (challenge_id, buyer_id)
);

-- Habilitar RLS
ALTER TABLE public.challenge_purchases ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. POLÍTICAS RLS PARA CHALLENGES
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.challenges;
DROP POLICY IF EXISTS "Professionals can create their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Professionals can update their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Professionals can delete their own challenges" ON public.challenges;

-- Todos pueden ver retos activos
CREATE POLICY "Anyone can view active challenges"
ON public.challenges
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Los profesionales pueden ver todos sus retos (activos e inactivos)
CREATE POLICY "Professionals can view their own challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = challenges.professional_id
        AND user_id = auth.uid()
    )
);

-- Los profesionales pueden crear sus propios retos
CREATE POLICY "Professionals can create their own challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = challenges.professional_id
        AND user_id = auth.uid()
        AND status = 'approved'
        AND is_active = true
    )
);

-- Los profesionales pueden actualizar sus propios retos
CREATE POLICY "Professionals can update their own challenges"
ON public.challenges
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = challenges.professional_id
        AND user_id = auth.uid()
    )
);

-- Los profesionales pueden eliminar sus propios retos
CREATE POLICY "Professionals can delete their own challenges"
ON public.challenges
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = challenges.professional_id
        AND user_id = auth.uid()
    )
);

-- ============================================================================
-- 5. POLÍTICAS RLS PARA CHALLENGE_FILES
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can view challenge files for purchased challenges" ON public.challenge_files;
DROP POLICY IF EXISTS "Professionals can manage files for their challenges" ON public.challenge_files;

-- Los usuarios pueden ver archivos de retos que han comprado
CREATE POLICY "Anyone can view challenge files for purchased challenges"
ON public.challenge_files
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.challenge_id = challenge_files.challenge_id
        AND challenge_purchases.buyer_id = auth.uid()
        AND challenge_purchases.access_granted = true
    )
    OR
    EXISTS (
        SELECT 1 FROM public.challenges
        INNER JOIN public.professional_applications ON challenges.professional_id = professional_applications.id
        WHERE challenges.id = challenge_files.challenge_id
        AND professional_applications.user_id = auth.uid()
    )
);

-- Los profesionales pueden gestionar archivos de sus retos
CREATE POLICY "Professionals can manage files for their challenges"
ON public.challenge_files
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenges
        INNER JOIN public.professional_applications ON challenges.professional_id = professional_applications.id
        WHERE challenges.id = challenge_files.challenge_id
        AND professional_applications.user_id = auth.uid()
    )
);

-- ============================================================================
-- 6. POLÍTICAS RLS PARA CHALLENGE_PURCHASES
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.challenge_purchases;
DROP POLICY IF EXISTS "Professionals can view purchases of their challenges" ON public.challenge_purchases;
DROP POLICY IF EXISTS "Users can create their own purchases" ON public.challenge_purchases;

-- Los usuarios pueden ver sus propias compras
CREATE POLICY "Users can view their own purchases"
ON public.challenge_purchases
FOR SELECT
TO authenticated
USING (buyer_id = auth.uid());

-- Los profesionales pueden ver compras de sus retos
CREATE POLICY "Professionals can view purchases of their challenges"
ON public.challenge_purchases
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = challenge_purchases.professional_id
        AND user_id = auth.uid()
    )
);

-- Los usuarios pueden crear sus propias compras (a través de la API)
CREATE POLICY "Users can create their own purchases"
ON public.challenge_purchases
FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- ============================================================================
-- 7. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_challenges_professional_id ON public.challenges(professional_id);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON public.challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON public.challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_files_challenge_id ON public.challenge_files(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_challenge_id ON public.challenge_purchases(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_buyer_id ON public.challenge_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_professional_id ON public.challenge_purchases(professional_id);
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_payment_status ON public.challenge_purchases(payment_status);

-- ============================================================================
-- 8. VISTA DE RETOS CON INFORMACIÓN DEL PROFESIONAL
-- ============================================================================

CREATE OR REPLACE VIEW public.challenges_with_professional AS
SELECT
    c.id,
    c.professional_id,
    c.title,
    c.description,
    c.short_description,
    c.price,
    c.currency,
    c.cover_image_url,
    c.duration_days,
    c.difficulty_level,
    c.category,
    c.is_active,
    c.sales_count,
    c.created_at,
    c.updated_at,
    pa.first_name as professional_first_name,
    pa.last_name as professional_last_name,
    pa.profile_photo as professional_photo,
    pa.profession as professional_profession,
    pa.is_verified as professional_is_verified
FROM public.challenges c
INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
WHERE c.is_active = true
AND pa.status = 'approved'
AND pa.is_active = true;

COMMENT ON VIEW public.challenges_with_professional IS 'Vista de retos activos con información del profesional que los creó';

-- ============================================================================
-- 9. FUNCIÓN PARA ACTUALIZAR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_challenges_updated_at_trigger
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION update_challenges_updated_at();

CREATE OR REPLACE FUNCTION update_challenge_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_challenge_purchases_updated_at_trigger
BEFORE UPDATE ON public.challenge_purchases
FOR EACH ROW
EXECUTE FUNCTION update_challenge_purchases_updated_at();

-- ============================================================================
-- 10. FUNCIÓN PARA INCREMENTAR CONTADOR DE VENTAS
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_challenge_sales(challenge_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.challenges
    SET sales_count = sales_count + 1
    WHERE id = challenge_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_challenge_sales IS 'Incrementa el contador de ventas de un reto';

-- ============================================================================
-- 11. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.challenges IS 'Retos creados por profesionales para usuarios';
COMMENT ON COLUMN public.challenges.professional_id IS 'ID del profesional que creó el reto';
COMMENT ON COLUMN public.challenges.price IS 'Precio del reto';
COMMENT ON COLUMN public.challenges.duration_days IS 'Duración del reto en días';
COMMENT ON COLUMN public.challenges.difficulty_level IS 'Nivel de dificultad: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN public.challenges.sales_count IS 'Número de veces que se ha vendido el reto';

COMMENT ON TABLE public.challenge_files IS 'Archivos multimedia asociados a un reto';
COMMENT ON COLUMN public.challenge_files.file_type IS 'Tipo de archivo: audio, video, pdf, image, document, other';
COMMENT ON COLUMN public.challenge_files.display_order IS 'Orden de visualización de los archivos';

COMMENT ON TABLE public.challenge_purchases IS 'Compras/registros de usuarios a retos';
COMMENT ON COLUMN public.challenge_purchases.payment_status IS 'Estado del pago: pending, succeeded, failed, refunded';
COMMENT ON COLUMN public.challenge_purchases.access_granted IS 'Si el usuario tiene acceso al contenido del reto';
