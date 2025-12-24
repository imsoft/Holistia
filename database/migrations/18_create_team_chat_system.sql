-- =====================================================
-- MIGRACIÓN 18: Sistema de Chat de Equipo
-- =====================================================
-- Descripción: Sistema completo de mensajería para equipos
-- Características:
--   - Mensajes de chat en tiempo real
--   - Reacciones a mensajes
--   - Indicadores de lectura
--   - Mensajes del sistema
--   - Notificaciones automáticas
-- =====================================================

-- Tabla de mensajes del equipo
CREATE TABLE IF NOT EXISTS public.team_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'user_message' CHECK (message_type IN (
        'user_message',      -- Mensaje normal de usuario
        'system_message',    -- Mensaje del sistema (ej: "Usuario X se unió")
        'checkin_share',     -- Compartir check-in
        'achievement_share'  -- Compartir logro
    )),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Info adicional según el tipo
    reply_to_id UUID REFERENCES public.team_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Índices para mejor performance
    CONSTRAINT non_empty_content CHECK (length(trim(content)) > 0)
);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON public.team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender_id ON public.team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON public.team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_team_created ON public.team_messages(team_id, created_at DESC);

-- Tabla de reacciones a mensajes
CREATE TABLE IF NOT EXISTS public.team_message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (emoji IN ('👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '💪')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un usuario solo puede reaccionar una vez con el mismo emoji
    CONSTRAINT unique_user_emoji_per_message UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_team_message_reactions_message_id ON public.team_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_team_message_reactions_user_id ON public.team_message_reactions(user_id);

-- Tabla de lecturas de mensajes
CREATE TABLE IF NOT EXISTS public.team_message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un usuario solo puede marcar como leído una vez
    CONSTRAINT unique_user_read_per_message UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_message_reads_message_id ON public.team_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_team_message_reads_user_id ON public.team_message_reads(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_message_reads ENABLE ROW LEVEL SECURITY;

-- Políticas para team_messages
CREATE POLICY "Los miembros del equipo pueden ver mensajes"
    ON public.team_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenge_team_members
            WHERE team_id = team_messages.team_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Los miembros del equipo pueden enviar mensajes"
    ON public.team_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenge_team_members
            WHERE team_id = team_messages.team_id
            AND user_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

CREATE POLICY "Los usuarios pueden editar sus propios mensajes"
    ON public.team_messages FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Los usuarios pueden eliminar sus propios mensajes"
    ON public.team_messages FOR DELETE
    USING (sender_id = auth.uid());

-- Políticas para team_message_reactions
CREATE POLICY "Los miembros del equipo pueden ver reacciones"
    ON public.team_message_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_messages tm
            JOIN public.challenge_team_members ctm ON tm.team_id = ctm.team_id
            WHERE tm.id = team_message_reactions.message_id
            AND ctm.user_id = auth.uid()
        )
    );

CREATE POLICY "Los miembros del equipo pueden reaccionar"
    ON public.team_message_reactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_messages tm
            JOIN public.challenge_team_members ctm ON tm.team_id = ctm.team_id
            WHERE tm.id = team_message_reactions.message_id
            AND ctm.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Los usuarios pueden quitar sus propias reacciones"
    ON public.team_message_reactions FOR DELETE
    USING (user_id = auth.uid());

-- Políticas para team_message_reads
CREATE POLICY "Los usuarios pueden ver sus propias lecturas"
    ON public.team_message_reads FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Los usuarios pueden marcar mensajes como leídos"
    ON public.team_message_reads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_messages tm
            JOIN public.challenge_team_members ctm ON tm.team_id = ctm.team_id
            WHERE tm.id = team_message_reads.message_id
            AND ctm.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para crear mensaje del sistema cuando un usuario se une
CREATE OR REPLACE FUNCTION public.create_team_join_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_messages (team_id, sender_id, message_type, content, metadata)
    SELECT
        NEW.team_id,
        NEW.user_id,
        'system_message',
        p.first_name || ' ' || p.last_name || ' se unió al equipo',
        jsonb_build_object('event_type', 'member_joined', 'member_id', NEW.user_id)
    FROM public.profiles p
    WHERE p.id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_team_join_message
    AFTER INSERT ON public.challenge_team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.create_team_join_message();

-- Función para crear mensaje del sistema cuando un usuario deja el equipo
CREATE OR REPLACE FUNCTION public.create_team_leave_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_messages (team_id, sender_id, message_type, content, metadata)
    SELECT
        OLD.team_id,
        OLD.user_id,
        'system_message',
        p.first_name || ' ' || p.last_name || ' dejó el equipo',
        jsonb_build_object('event_type', 'member_left', 'member_id', OLD.user_id)
    FROM public.profiles p
    WHERE p.id = OLD.user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_team_leave_message
    AFTER DELETE ON public.challenge_team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.create_team_leave_message();

-- Función para notificar nuevos mensajes a miembros del equipo
CREATE OR REPLACE FUNCTION public.notify_team_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo notificar para mensajes de usuario (no del sistema)
    IF NEW.message_type = 'user_message' THEN
        -- Insertar notificaciones para todos los miembros excepto el remitente
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            related_user_id,
            related_team_id,
            metadata
        )
        SELECT
            ctm.user_id,
            'team_message',
            'Nuevo mensaje en equipo',
            (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = NEW.sender_id) ||
            ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
            '/patient/' || ctm.user_id::text || '/my-challenges?team=' || NEW.team_id::text,
            NEW.sender_id,
            NEW.team_id,
            jsonb_build_object('message_id', NEW.id)
        FROM public.challenge_team_members ctm
        WHERE ctm.team_id = NEW.team_id
        AND ctm.user_id != NEW.sender_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_team_message
    AFTER INSERT ON public.team_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_team_message();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para obtener mensajes con información del remitente y reacciones
CREATE OR REPLACE VIEW public.team_chat_messages AS
SELECT
    tm.id,
    tm.team_id,
    tm.sender_id,
    tm.message_type,
    tm.content,
    tm.metadata,
    tm.reply_to_id,
    tm.is_edited,
    tm.edited_at,
    tm.created_at,
    -- Información del remitente
    p.first_name AS sender_first_name,
    p.last_name AS sender_last_name,
    p.avatar_url AS sender_avatar_url,
    -- Conteo de reacciones por tipo
    (
        SELECT jsonb_object_agg(emoji, count)
        FROM (
            SELECT emoji, COUNT(*)::int AS count
            FROM public.team_message_reactions
            WHERE message_id = tm.id
            GROUP BY emoji
        ) reactions
    ) AS reactions,
    -- Total de reacciones
    (
        SELECT COUNT(*)::int
        FROM public.team_message_reactions
        WHERE message_id = tm.id
    ) AS total_reactions,
    -- Conteo de lecturas
    (
        SELECT COUNT(*)::int
        FROM public.team_message_reads
        WHERE message_id = tm.id
    ) AS read_count
FROM public.team_messages tm
LEFT JOIN public.profiles p ON p.id = tm.sender_id;

-- Vista para obtener mensajes no leídos por equipo
CREATE OR REPLACE VIEW public.team_unread_messages AS
SELECT
    ctm.user_id,
    ctm.team_id,
    COUNT(tm.id)::int AS unread_count,
    MAX(tm.created_at) AS last_message_at
FROM public.challenge_team_members ctm
JOIN public.team_messages tm ON tm.team_id = ctm.team_id
LEFT JOIN public.team_message_reads tmr ON tmr.message_id = tm.id AND tmr.user_id = ctm.user_id
WHERE tmr.id IS NULL
AND tm.sender_id != ctm.user_id
GROUP BY ctm.user_id, ctm.team_id;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.team_messages IS 'Mensajes del chat de equipo con soporte para diferentes tipos';
COMMENT ON TABLE public.team_message_reactions IS 'Reacciones emoji a mensajes del chat';
COMMENT ON TABLE public.team_message_reads IS 'Registro de lecturas de mensajes';
COMMENT ON VIEW public.team_chat_messages IS 'Vista completa de mensajes con información del remitente y reacciones';
COMMENT ON VIEW public.team_unread_messages IS 'Conteo de mensajes no leídos por equipo y usuario';
