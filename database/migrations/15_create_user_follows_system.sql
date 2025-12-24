-- =====================================================
-- MIGRACIÓN 15: Sistema de Seguimiento de Usuarios
-- =====================================================
-- Descripción: Sistema para que usuarios puedan seguirse entre sí
-- =====================================================

-- Tabla de seguimientos entre usuarios
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un usuario no puede seguir al mismo usuario dos veces
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    -- Un usuario no puede seguirse a sí mismo
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON public.user_follows(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los seguimientos
CREATE POLICY "Los seguimientos son públicos"
    ON public.user_follows FOR SELECT
    USING (true);

-- Los usuarios pueden crear seguimientos
CREATE POLICY "Los usuarios pueden seguir a otros"
    ON public.user_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Los usuarios pueden eliminar sus propios seguimientos
CREATE POLICY "Los usuarios pueden dejar de seguir"
    ON public.user_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Eliminar vista anterior si existe con tipo diferente
DROP VIEW IF EXISTS public.user_follow_stats;

-- Vista para obtener estadísticas de seguidores
CREATE VIEW public.user_follow_stats AS
SELECT
    u.id AS user_id,
    COALESCE(followers.count, 0) AS followers_count,
    COALESCE(following.count, 0) AS following_count
FROM auth.users u
LEFT JOIN (
    SELECT following_id, COUNT(*) AS count
    FROM public.user_follows
    GROUP BY following_id
) followers ON u.id = followers.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) AS count
    FROM public.user_follows
    GROUP BY follower_id
) following ON u.id = following.follower_id;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.user_follows IS 'Relaciones de seguimiento entre usuarios';
COMMENT ON VIEW public.user_follow_stats IS 'Estadísticas de seguidores y seguidos por usuario';
