-- Migración 15: Sistema de feed social para evidencias de retos
-- Permite que los usuarios compartan sus check-ins públicamente
-- Los usuarios pueden ver check-ins de personas que siguen o recomendaciones

-- ============================================================================
-- 1. AGREGAR COLUMNAS DE VISIBILIDAD A CHALLENGE_CHECKINS
-- ============================================================================

-- Agregar columnas para controlar la visibilidad de los check-ins
ALTER TABLE public.challenge_checkins
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0 NOT NULL;

-- Crear índice para búsquedas de check-ins públicos
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_public ON public.challenge_checkins(is_public, checkin_time DESC) WHERE is_public = true;

-- ============================================================================
-- 2. TABLA DE LIKES EN CHECK-INS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_checkin_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkin_id UUID NOT NULL REFERENCES public.challenge_checkins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un usuario solo puede dar like una vez por check-in
    CONSTRAINT challenge_checkin_likes_unique UNIQUE (checkin_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.challenge_checkin_likes ENABLE ROW LEVEL SECURITY;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_checkin_likes_checkin ON public.challenge_checkin_likes(checkin_id);
CREATE INDEX IF NOT EXISTS idx_checkin_likes_user ON public.challenge_checkin_likes(user_id);

-- ============================================================================
-- 3. TABLA DE COMENTARIOS EN CHECK-INS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_checkin_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkin_id UUID NOT NULL REFERENCES public.challenge_checkins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.challenge_checkin_comments ENABLE ROW LEVEL SECURITY;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_checkin_comments_checkin ON public.challenge_checkin_comments(checkin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_comments_user ON public.challenge_checkin_comments(user_id);

-- ============================================================================
-- 4. VISTA PARA FEED SOCIAL DE CHECK-INS
-- ============================================================================

CREATE OR REPLACE VIEW public.social_feed_checkins AS
SELECT
    cc.id as checkin_id,
    cc.challenge_purchase_id,
    cc.day_number,
    cc.checkin_date,
    cc.checkin_time,
    cc.evidence_type,
    cc.evidence_url,
    cc.notes,
    cc.points_earned,
    cc.is_public,
    cc.likes_count,
    cc.comments_count,
    -- Información del usuario que hizo el check-in
    cp.buyer_id as user_id,
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.photo_url as user_photo_url,
    p.type as user_type,
    -- Información del reto
    c.id as challenge_id,
    c.title as challenge_title,
    c.cover_image_url as challenge_cover_image,
    c.category as challenge_category,
    c.difficulty_level as challenge_difficulty,
    -- Información del profesional que creó el reto
    pa.id as professional_id,
    pa.first_name as professional_first_name,
    pa.last_name as professional_last_name,
    pa.profile_photo as professional_photo,
    -- Progreso del usuario en el reto
    pr.current_streak,
    pr.days_completed,
    pr.completion_percentage
FROM public.challenge_checkins cc
INNER JOIN public.challenge_purchases cp ON cc.challenge_purchase_id = cp.id
INNER JOIN public.challenges c ON cp.challenge_id = c.id
INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
INNER JOIN public.profiles p ON cp.buyer_id = p.id
LEFT JOIN public.challenge_progress pr ON cp.id = pr.challenge_purchase_id
WHERE cc.is_public = true
  AND c.is_active = true
  AND pa.status = 'approved'
  AND pa.is_active = true;

COMMENT ON VIEW public.social_feed_checkins IS 'Vista de check-ins públicos con información del usuario, reto y profesional para el feed social';

-- ============================================================================
-- 5. POLÍTICAS RLS PARA CHALLENGE_CHECKIN_LIKES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all public checkin likes" ON public.challenge_checkin_likes;
DROP POLICY IF EXISTS "Users can like public checkins" ON public.challenge_checkin_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.challenge_checkin_likes;

-- Todos pueden ver los likes
CREATE POLICY "Users can view all public checkin likes"
ON public.challenge_checkin_likes
FOR SELECT
TO authenticated
USING (true);

-- Los usuarios pueden dar like a check-ins públicos
CREATE POLICY "Users can like public checkins"
ON public.challenge_checkin_likes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_checkins
        WHERE id = checkin_id AND is_public = true
    )
    AND auth.uid() = user_id
);

-- Los usuarios pueden eliminar sus propios likes
CREATE POLICY "Users can unlike their own likes"
ON public.challenge_checkin_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. POLÍTICAS RLS PARA CHALLENGE_CHECKIN_COMMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view comments on public checkins" ON public.challenge_checkin_comments;
DROP POLICY IF EXISTS "Users can comment on public checkins" ON public.challenge_checkin_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.challenge_checkin_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.challenge_checkin_comments;

-- Todos pueden ver comentarios en check-ins públicos
CREATE POLICY "Users can view comments on public checkins"
ON public.challenge_checkin_comments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_checkins
        WHERE id = checkin_id AND is_public = true AND allow_comments = true
    )
);

-- Los usuarios pueden comentar en check-ins públicos
CREATE POLICY "Users can comment on public checkins"
ON public.challenge_checkin_comments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_checkins
        WHERE id = checkin_id AND is_public = true AND allow_comments = true
    )
    AND auth.uid() = user_id
);

-- Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Users can update their own comments"
ON public.challenge_checkin_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete their own comments"
ON public.challenge_checkin_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 7. ACTUALIZAR POLÍTICAS RLS DE CHALLENGE_CHECKINS PARA FEED PÚBLICO
-- ============================================================================

-- Agregar política para que todos puedan ver check-ins públicos
DROP POLICY IF EXISTS "Anyone can view public checkins" ON public.challenge_checkins;

CREATE POLICY "Anyone can view public checkins"
ON public.challenge_checkins
FOR SELECT
TO authenticated
USING (
    is_public = true
    OR
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE id = challenge_purchase_id AND buyer_id = auth.uid()
    )
);

-- ============================================================================
-- 8. FUNCIÓN PARA ACTUALIZAR CONTADORES DE LIKES Y COMENTARIOS
-- ============================================================================

-- Función para actualizar el contador de likes
CREATE OR REPLACE FUNCTION public.update_checkin_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.challenge_checkins
        SET likes_count = likes_count + 1
        WHERE id = NEW.checkin_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.challenge_checkins
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.checkin_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar contador de likes
DROP TRIGGER IF EXISTS trigger_update_checkin_likes_count ON public.challenge_checkin_likes;
CREATE TRIGGER trigger_update_checkin_likes_count
AFTER INSERT OR DELETE ON public.challenge_checkin_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_checkin_likes_count();

-- Función para actualizar el contador de comentarios
CREATE OR REPLACE FUNCTION public.update_checkin_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.challenge_checkins
        SET comments_count = comments_count + 1
        WHERE id = NEW.checkin_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.challenge_checkins
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.checkin_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar contador de comentarios
DROP TRIGGER IF EXISTS trigger_update_checkin_comments_count ON public.challenge_checkin_comments;
CREATE TRIGGER trigger_update_checkin_comments_count
AFTER INSERT OR DELETE ON public.challenge_checkin_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_checkin_comments_count();

-- ============================================================================
-- COMENTARIOS SOBRE EL DISEÑO
-- ============================================================================

-- Este sistema permite:
-- 1. Los usuarios pueden hacer sus check-ins públicos o privados
-- 2. Los check-ins públicos aparecen en el feed social
-- 3. Los usuarios pueden dar like y comentar en check-ins públicos
-- 4. La vista social_feed_checkins combina toda la información necesaria para el feed
-- 5. Los contadores de likes y comentarios se actualizan automáticamente con triggers
-- 6. El feed puede filtrarse por usuarios seguidos usando la tabla user_follows existente
