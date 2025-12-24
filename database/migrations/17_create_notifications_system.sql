-- Migración 17: Sistema de notificaciones en tiempo real
-- Notificaciones para invitaciones, seguimientos, likes, comentarios, etc.

-- ============================================================================
-- 1. TABLA DE NOTIFICACIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'team_invitation',
        'invitation_accepted',
        'invitation_rejected',
        'team_checkin',
        'new_follower',
        'post_like',
        'post_comment',
        'comment_mention',
        'team_member_joined',
        'team_member_left',
        'challenge_completed',
        'streak_milestone',
        'badge_earned'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    action_url TEXT,
    -- Metadata como JSON para información adicional
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Referencias opcionales según el tipo
    related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    related_team_id UUID REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
    related_checkin_id UUID REFERENCES public.challenge_checkins(id) ON DELETE CASCADE,
    related_comment_id UUID REFERENCES public.challenge_checkin_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(user_id, type);

-- ============================================================================
-- 2. POLÍTICAS RLS PARA NOTIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Ver propias notificaciones
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Actualizar propias notificaciones (marcar como leídas)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- El sistema puede crear notificaciones
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 3. FUNCIÓN PARA CREAR NOTIFICACIÓN DE INVITACIÓN A EQUIPO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_team_invitation()
RETURNS TRIGGER AS $$
DECLARE
    inviter_name TEXT;
    team_name TEXT;
    challenge_title TEXT;
BEGIN
    -- Obtener nombre del invitador
    SELECT CONCAT(first_name, ' ', last_name) INTO inviter_name
    FROM public.profiles
    WHERE id = NEW.inviter_id;

    -- Obtener información del equipo y reto
    SELECT ct.team_name, c.title INTO team_name, challenge_title
    FROM public.challenge_teams ct
    INNER JOIN public.challenges c ON ct.challenge_id = c.id
    WHERE ct.id = NEW.team_id;

    -- Crear notificación
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        metadata,
        related_user_id,
        related_team_id
    ) VALUES (
        NEW.invitee_id,
        'team_invitation',
        'Nueva invitación a equipo',
        inviter_name || ' te invitó a unirte a su equipo' ||
            COALESCE(' "' || team_name || '"', '') ||
            ' para el reto "' || challenge_title || '"',
        '/patient/' || NEW.invitee_id || '/my-challenges',
        jsonb_build_object(
            'invitation_id', NEW.id,
            'team_id', NEW.team_id,
            'inviter_id', NEW.inviter_id
        ),
        NEW.inviter_id,
        NEW.team_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para invitaciones a equipo
DROP TRIGGER IF EXISTS trigger_notify_team_invitation ON public.challenge_team_invitations;
CREATE TRIGGER trigger_notify_team_invitation
AFTER INSERT ON public.challenge_team_invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_team_invitation();

-- ============================================================================
-- 4. FUNCIÓN PARA NOTIFICAR RESPUESTA A INVITACIÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_invitation_response()
RETURNS TRIGGER AS $$
DECLARE
    invitee_name TEXT;
    team_name TEXT;
    challenge_title TEXT;
BEGIN
    -- Solo notificar cuando cambia el estado
    IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected') THEN
        -- Obtener nombre del invitado
        SELECT CONCAT(first_name, ' ', last_name) INTO invitee_name
        FROM public.profiles
        WHERE id = NEW.invitee_id;

        -- Obtener información del equipo
        SELECT ct.team_name, c.title INTO team_name, challenge_title
        FROM public.challenge_teams ct
        INNER JOIN public.challenges c ON ct.challenge_id = c.id
        WHERE ct.id = NEW.team_id;

        -- Crear notificación para el invitador
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            metadata,
            related_user_id,
            related_team_id
        ) VALUES (
            NEW.inviter_id,
            CASE
                WHEN NEW.status = 'accepted' THEN 'invitation_accepted'
                ELSE 'invitation_rejected'
            END,
            CASE
                WHEN NEW.status = 'accepted' THEN '¡Invitación aceptada!'
                ELSE 'Invitación rechazada'
            END,
            invitee_name ||
            CASE
                WHEN NEW.status = 'accepted' THEN ' aceptó tu invitación'
                ELSE ' rechazó tu invitación'
            END ||
            ' para el reto "' || challenge_title || '"',
            '/patient/' || NEW.inviter_id || '/my-challenges',
            jsonb_build_object(
                'invitation_id', NEW.id,
                'team_id', NEW.team_id,
                'invitee_id', NEW.invitee_id,
                'status', NEW.status
            ),
            NEW.invitee_id,
            NEW.team_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para respuestas a invitación
DROP TRIGGER IF EXISTS trigger_notify_invitation_response ON public.challenge_team_invitations;
CREATE TRIGGER trigger_notify_invitation_response
AFTER UPDATE ON public.challenge_team_invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_invitation_response();

-- ============================================================================
-- 5. FUNCIÓN PARA NOTIFICAR NUEVO SEGUIDOR
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    -- Obtener nombre del seguidor
    SELECT CONCAT(first_name, ' ', last_name) INTO follower_name
    FROM public.profiles
    WHERE id = NEW.follower_id;

    -- Crear notificación
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        metadata,
        related_user_id
    ) VALUES (
        NEW.following_id,
        'new_follower',
        'Nuevo seguidor',
        follower_name || ' comenzó a seguirte',
        '/patient/' || NEW.following_id || '/profile/' || NEW.follower_id,
        jsonb_build_object('follower_id', NEW.follower_id),
        NEW.follower_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos seguidores
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON public.user_follows;
CREATE TRIGGER trigger_notify_new_follower
AFTER INSERT ON public.user_follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_follower();

-- ============================================================================
-- 6. FUNCIÓN PARA NOTIFICAR LIKES EN POSTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
    liker_name TEXT;
    post_owner_id UUID;
    challenge_title TEXT;
BEGIN
    -- Obtener el dueño del post
    SELECT cp.buyer_id, c.title INTO post_owner_id, challenge_title
    FROM public.challenge_checkins cc
    INNER JOIN public.challenge_purchases cp ON cc.challenge_purchase_id = cp.id
    INNER JOIN public.challenges c ON cp.challenge_id = c.id
    WHERE cc.id = NEW.checkin_id;

    -- No notificar si el usuario se da like a sí mismo
    IF NEW.user_id = post_owner_id THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del que dio like
    SELECT CONCAT(first_name, ' ', last_name) INTO liker_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Crear notificación
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        metadata,
        related_user_id,
        related_checkin_id
    ) VALUES (
        post_owner_id,
        'post_like',
        'Le gustó tu publicación',
        liker_name || ' le dio like a tu check-in del reto "' || challenge_title || '"',
        '/patient/' || post_owner_id || '/feed',
        jsonb_build_object(
            'liker_id', NEW.user_id,
            'checkin_id', NEW.checkin_id
        ),
        NEW.user_id,
        NEW.checkin_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para likes
DROP TRIGGER IF EXISTS trigger_notify_post_like ON public.challenge_checkin_likes;
CREATE TRIGGER trigger_notify_post_like
AFTER INSERT ON public.challenge_checkin_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_like();

-- ============================================================================
-- 7. FUNCIÓN PARA NOTIFICAR COMENTARIOS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    commenter_name TEXT;
    post_owner_id UUID;
    challenge_title TEXT;
BEGIN
    -- Obtener el dueño del post
    SELECT cp.buyer_id, c.title INTO post_owner_id, challenge_title
    FROM public.challenge_checkins cc
    INNER JOIN public.challenge_purchases cp ON cc.challenge_purchase_id = cp.id
    INNER JOIN public.challenges c ON cp.challenge_id = c.id
    WHERE cc.id = NEW.checkin_id;

    -- No notificar si el usuario comenta en su propio post
    IF NEW.user_id = post_owner_id THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del comentarista
    SELECT CONCAT(first_name, ' ', last_name) INTO commenter_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Crear notificación
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        metadata,
        related_user_id,
        related_checkin_id,
        related_comment_id
    ) VALUES (
        post_owner_id,
        'post_comment',
        'Nuevo comentario',
        commenter_name || ' comentó en tu check-in del reto "' || challenge_title || '"',
        '/patient/' || post_owner_id || '/feed',
        jsonb_build_object(
            'commenter_id', NEW.user_id,
            'checkin_id', NEW.checkin_id,
            'comment_id', NEW.id
        ),
        NEW.user_id,
        NEW.checkin_id,
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para comentarios
DROP TRIGGER IF EXISTS trigger_notify_post_comment ON public.challenge_checkin_comments;
CREATE TRIGGER trigger_notify_post_comment
AFTER INSERT ON public.challenge_checkin_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_comment();

-- ============================================================================
-- 8. FUNCIÓN PARA NOTIFICAR CHECK-IN DE COMPAÑERO DE EQUIPO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_team_checkin()
RETURNS TRIGGER AS $$
DECLARE
    member_name TEXT;
    team_members UUID[];
    member_id UUID;
    challenge_title TEXT;
    team_name TEXT;
    team_id_var UUID;
BEGIN
    -- Verificar si el check-in es de un equipo
    SELECT cp.team_id INTO team_id_var
    FROM public.challenge_purchases cp
    WHERE cp.id = NEW.challenge_purchase_id
    AND cp.is_team_challenge = true;

    IF team_id_var IS NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del usuario y título del reto
    SELECT
        CONCAT(p.first_name, ' ', p.last_name),
        c.title,
        ct.team_name
    INTO member_name, challenge_title, team_name
    FROM public.challenge_purchases cp
    INNER JOIN public.profiles p ON cp.buyer_id = p.id
    INNER JOIN public.challenges c ON cp.challenge_id = c.id
    INNER JOIN public.challenge_teams ct ON cp.team_id = ct.id
    WHERE cp.id = NEW.challenge_purchase_id;

    -- Obtener todos los miembros del equipo excepto el que hizo el check-in
    SELECT ARRAY_AGG(user_id) INTO team_members
    FROM public.challenge_team_members
    WHERE team_id = team_id_var
    AND user_id != (
        SELECT buyer_id FROM public.challenge_purchases WHERE id = NEW.challenge_purchase_id
    );

    -- Crear notificación para cada miembro
    IF team_members IS NOT NULL THEN
        FOREACH member_id IN ARRAY team_members
        LOOP
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                action_url,
                metadata,
                related_user_id,
                related_team_id,
                related_checkin_id
            ) VALUES (
                member_id,
                'team_checkin',
                'Check-in de equipo',
                member_name || ' completó el día ' || NEW.day_number ||
                    ' del reto' || COALESCE(' "' || team_name || '"', ''),
                '/patient/' || member_id || '/feed',
                jsonb_build_object(
                    'checkin_id', NEW.id,
                    'team_id', team_id_var,
                    'day_number', NEW.day_number
                ),
                (SELECT buyer_id FROM public.challenge_purchases WHERE id = NEW.challenge_purchase_id),
                team_id_var,
                NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para check-ins de equipo
DROP TRIGGER IF EXISTS trigger_notify_team_checkin ON public.challenge_checkins;
CREATE TRIGGER trigger_notify_team_checkin
AFTER INSERT ON public.challenge_checkins
FOR EACH ROW
EXECUTE FUNCTION public.notify_team_checkin();

-- ============================================================================
-- 9. VISTA PARA NOTIFICACIONES CON INFORMACIÓN COMPLETA
-- ============================================================================

CREATE OR REPLACE VIEW public.notifications_with_details AS
SELECT
    n.*,
    -- Información del usuario relacionado
    p.first_name as related_user_first_name,
    p.last_name as related_user_last_name,
    p.avatar_url as related_user_avatar
FROM public.notifications n
LEFT JOIN public.profiles p ON n.related_user_id = p.id;

COMMENT ON VIEW public.notifications_with_details IS 'Vista de notificaciones con información del usuario relacionado';

-- ============================================================================
-- COMENTARIOS SOBRE EL DISEÑO
-- ============================================================================

-- Este sistema de notificaciones:
-- 1. Se activa automáticamente con triggers en las acciones relevantes
-- 2. Incluye metadata en JSON para información adicional
-- 3. Tiene action_url para redireccionar al usuario
-- 4. Soporta múltiples tipos de notificaciones
-- 5. Optimizado con índices para búsquedas rápidas
-- 6. RLS habilitado para seguridad
