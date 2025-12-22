-- Migración 143: Sistema de seguimiento entre usuarios y profesionales
-- Permite que usuarios sigan a otros usuarios y profesionales, y viceversa

-- ============================================================================
-- 1. TABLA DE SEGUIMIENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: Un usuario no puede seguirse a sí mismo
    CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id),
    
    -- Constraint: Un usuario solo puede seguir a otro una vez
    CONSTRAINT follows_unique_pair UNIQUE (follower_id, following_id)
);

-- Habilitar RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLÍTICAS RLS PARA FOLLOWS
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;
DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

-- Todos pueden ver los seguimientos (para mostrar contadores)
CREATE POLICY "Users can view all follows"
ON public.follows
FOR SELECT
TO authenticated, anon
USING (true);

-- Los usuarios autenticados pueden crear sus propios seguimientos
CREATE POLICY "Users can create their own follows"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- Los usuarios autenticados pueden eliminar sus propios seguimientos
CREATE POLICY "Users can delete their own follows"
ON public.follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- ============================================================================
-- 3. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- Índice compuesto para búsquedas rápidas de relaciones
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON public.follows(follower_id, following_id);

-- ============================================================================
-- 4. VISTAS PARA CONTADORES
-- ============================================================================

-- Vista para contar seguidores de un usuario
CREATE OR REPLACE VIEW public.user_followers_count AS
SELECT
    following_id as user_id,
    COUNT(*) as followers_count
FROM public.follows
GROUP BY following_id;

COMMENT ON VIEW public.user_followers_count IS 'Contador de seguidores por usuario';

-- Vista para contar a quién sigue un usuario
CREATE OR REPLACE VIEW public.user_following_count AS
SELECT
    follower_id as user_id,
    COUNT(*) as following_count
FROM public.follows
GROUP BY follower_id;

COMMENT ON VIEW public.user_following_count IS 'Contador de usuarios que sigue cada usuario';

-- Vista combinada con ambos contadores
CREATE OR REPLACE VIEW public.user_follow_stats AS
SELECT
    COALESCE(followers.user_id, following.user_id) as user_id,
    COALESCE(followers.followers_count, 0) as followers_count,
    COALESCE(following.following_count, 0) as following_count
FROM public.user_followers_count followers
FULL OUTER JOIN public.user_following_count following ON followers.user_id = following.user_id;

COMMENT ON VIEW public.user_follow_stats IS 'Estadísticas de seguimiento por usuario (seguidores y seguidos)';

-- ============================================================================
-- 5. FUNCIÓN PARA VERIFICAR SI UN USUARIO SIGUE A OTRO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_follower_id
        AND following_id = p_following_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_following IS 'Verifica si un usuario sigue a otro';

-- ============================================================================
-- 6. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.follows IS 'Relaciones de seguimiento entre usuarios (usuarios normales y profesionales)';
COMMENT ON COLUMN public.follows.follower_id IS 'ID del usuario que sigue';
COMMENT ON COLUMN public.follows.following_id IS 'ID del usuario que es seguido';
