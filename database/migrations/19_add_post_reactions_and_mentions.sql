-- =====================================================
-- MIGRACIÓN 19: Sistema de Reacciones y Menciones en Posts
-- =====================================================
-- Descripción: Añade reacciones tipo Facebook y menciones en posts
-- =====================================================

-- Tabla de reacciones a posts (check-ins)
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkin_id UUID NOT NULL REFERENCES public.challenge_checkins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'strong', 'clap', 'wow')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un usuario solo puede reaccionar una vez a un post (pero puede cambiar su reacción)
    CONSTRAINT unique_user_reaction_per_post UNIQUE (checkin_id, user_id)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_checkin_id ON public.post_reactions(checkin_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_created_at ON public.post_reactions(created_at DESC);

-- Tabla de menciones en comentarios
CREATE TABLE IF NOT EXISTS public.comment_mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.challenge_checkin_comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Evitar menciones duplicadas en el mismo comentario
    CONSTRAINT unique_mention_per_comment UNIQUE (comment_id, mentioned_user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment_id ON public.comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_user_id ON public.comment_mentions(mentioned_user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

-- Políticas para post_reactions
DROP POLICY IF EXISTS "Las reacciones son públicas" ON public.post_reactions;
CREATE POLICY "Las reacciones son públicas"
    ON public.post_reactions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Los usuarios pueden agregar reacciones" ON public.post_reactions;
CREATE POLICY "Los usuarios pueden agregar reacciones"
    ON public.post_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus reacciones" ON public.post_reactions;
CREATE POLICY "Los usuarios pueden actualizar sus reacciones"
    ON public.post_reactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus reacciones" ON public.post_reactions;
CREATE POLICY "Los usuarios pueden eliminar sus reacciones"
    ON public.post_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para comment_mentions
DROP POLICY IF EXISTS "Las menciones son públicas" ON public.comment_mentions;
CREATE POLICY "Las menciones son públicas"
    ON public.comment_mentions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Los usuarios pueden crear menciones" ON public.comment_mentions;
CREATE POLICY "Los usuarios pueden crear menciones"
    ON public.comment_mentions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenge_checkin_comments
            WHERE id = comment_mentions.comment_id
            AND user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para notificar reacciones (solo si existe tabla notifications)
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS TRIGGER AS $$
DECLARE
    checkin_owner_id UUID;
    reactor_name TEXT;
    notifications_exists BOOLEAN;
BEGIN
    -- Verificar si existe la tabla notifications
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
    ) INTO notifications_exists;

    -- Si no existe la tabla, no hacer nada
    IF NOT notifications_exists THEN
        RETURN NEW;
    END IF;

    -- Obtener el dueño del check-in
    SELECT cp.buyer_id INTO checkin_owner_id
    FROM public.challenge_checkins cc
    JOIN public.challenge_purchases cp ON cp.id = cc.challenge_purchase_id
    WHERE cc.id = NEW.checkin_id;

    -- No notificar si el usuario reacciona a su propio post
    IF checkin_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del usuario que reaccionó
    SELECT first_name || ' ' || last_name INTO reactor_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Insertar notificación
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        related_user_id,
        metadata
    ) VALUES (
        checkin_owner_id,
        'post_reaction',
        'Nueva reacción en tu publicación',
        reactor_name || ' reaccionó a tu check-in',
        '/patient/' || checkin_owner_id::text || '/feed',
        NEW.user_id,
        jsonb_build_object(
            'checkin_id', NEW.checkin_id,
            'reaction_type', NEW.reaction_type
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_post_reaction ON public.post_reactions;
CREATE TRIGGER trigger_notify_post_reaction
    AFTER INSERT ON public.post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_post_reaction();

-- Función para notificar menciones (solo si existe tabla notifications)
CREATE OR REPLACE FUNCTION public.notify_comment_mention()
RETURNS TRIGGER AS $$
DECLARE
    comment_author_id UUID;
    author_name TEXT;
    comment_text TEXT;
    notifications_exists BOOLEAN;
BEGIN
    -- Verificar si existe la tabla notifications
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
    ) INTO notifications_exists;

    -- Si no existe la tabla, no hacer nada
    IF NOT notifications_exists THEN
        RETURN NEW;
    END IF;

    -- Obtener info del comentario y autor
    SELECT user_id, notes INTO comment_author_id, comment_text
    FROM public.challenge_checkin_comments
    WHERE id = NEW.comment_id;

    -- No notificar si el usuario se menciona a sí mismo
    IF NEW.mentioned_user_id = comment_author_id THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del autor
    SELECT first_name || ' ' || last_name INTO author_name
    FROM public.profiles
    WHERE id = comment_author_id;

    -- Insertar notificación
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        related_user_id,
        metadata
    ) VALUES (
        NEW.mentioned_user_id,
        'comment_mention',
        'Te mencionaron en un comentario',
        author_name || ' te mencionó: ' || LEFT(comment_text, 50) ||
        CASE WHEN LENGTH(comment_text) > 50 THEN '...' ELSE '' END,
        '/patient/' || NEW.mentioned_user_id::text || '/feed',
        comment_author_id,
        jsonb_build_object('comment_id', NEW.comment_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_comment_mention ON public.comment_mentions;
CREATE TRIGGER trigger_notify_comment_mention
    AFTER INSERT ON public.comment_mentions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_comment_mention();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista actualizada del feed social con reacciones
DROP VIEW IF EXISTS public.social_feed_checkins CASCADE;

CREATE VIEW public.social_feed_checkins AS
SELECT
    cc.id AS checkin_id,
    cc.challenge_purchase_id,
    cc.day_number,
    cc.checkin_date,
    cc.evidence_type,
    cc.evidence_url,
    cc.notes,
    cc.points_earned,
    cc.created_at,

    -- Usuario que hizo el check-in
    p.id AS user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,

    -- Información del reto
    ch.id AS challenge_id,
    ch.title AS challenge_title,
    ch.cover_image_url AS challenge_cover_url,
    ch.category AS challenge_category,
    ch.difficulty_level,

    -- Likes (legacy - mantener compatibilidad)
    COALESCE(like_count.count, 0) AS like_count,

    -- Reacciones por tipo
    (
        SELECT jsonb_object_agg(reaction_type, count)
        FROM (
            SELECT reaction_type, COUNT(*)::int AS count
            FROM public.post_reactions
            WHERE checkin_id = cc.id
            GROUP BY reaction_type
        ) reactions
    ) AS reactions,

    -- Total de reacciones
    COALESCE(total_reactions.count, 0) AS total_reactions,

    -- Comentarios
    COALESCE(comment_count.count, 0) AS comment_count

FROM public.challenge_checkins cc
JOIN public.challenge_purchases cp ON cp.id = cc.challenge_purchase_id
JOIN public.profiles p ON p.id = cp.buyer_id
JOIN public.challenges ch ON ch.id = cp.challenge_id
LEFT JOIN (
    SELECT checkin_id, COUNT(*)::bigint AS count
    FROM public.challenge_checkin_likes
    GROUP BY checkin_id
) like_count ON like_count.checkin_id = cc.id
LEFT JOIN (
    SELECT checkin_id, COUNT(*)::bigint AS count
    FROM public.post_reactions
    GROUP BY checkin_id
) total_reactions ON total_reactions.checkin_id = cc.id
LEFT JOIN (
    SELECT checkin_id, COUNT(*)::bigint AS count
    FROM public.challenge_checkin_comments
    GROUP BY checkin_id
) comment_count ON comment_count.checkin_id = cc.id
WHERE cc.evidence_url IS NOT NULL
ORDER BY cc.created_at DESC;

-- =====================================================
-- ACTUALIZAR TIPO DE NOTIFICACIÓN (si la tabla existe)
-- =====================================================

-- Agregar nuevos tipos de notificación si la tabla notifications existe
DO $$
BEGIN
    -- Verificar si la tabla notifications existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
    ) THEN
        -- Eliminar constraint anterior si existe
        ALTER TABLE public.notifications
        DROP CONSTRAINT IF EXISTS notifications_type_check;

        -- Agregar constraint actualizado
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_type_check CHECK (type IN (
            'team_invitation', 'invitation_accepted', 'invitation_rejected',
            'team_checkin', 'new_follower', 'post_like', 'post_comment',
            'comment_mention', 'team_member_joined', 'team_member_left',
            'challenge_completed', 'streak_milestone', 'badge_earned',
            'team_message', 'post_reaction'
        ));
    END IF;
END $$;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.post_reactions IS 'Reacciones tipo Facebook para posts del feed';
COMMENT ON TABLE public.comment_mentions IS 'Menciones de usuarios en comentarios';
COMMENT ON VIEW public.social_feed_checkins IS 'Vista del feed social con reacciones y métricas actualizadas';
