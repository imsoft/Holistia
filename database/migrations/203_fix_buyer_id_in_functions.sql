-- Migración 203: Corregir funciones y triggers que usan buyer_id (renombrado a participant_id)
-- Esta migración actualiza las funciones que todavía hacen referencia a buyer_id

-- ============================================================================
-- CORREGIR FUNCIÓN notify_post_reaction
-- ============================================================================

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

    -- Obtener el dueño del check-in (usando participant_id en lugar de buyer_id)
    SELECT cp.participant_id INTO checkin_owner_id
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
        COALESCE(reactor_name, 'Alguien') || ' reaccionó a tu publicación',
        '/feed',
        NEW.user_id,
        jsonb_build_object(
            'checkin_id', NEW.checkin_id,
            'reaction_type', NEW.reaction_type
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.notify_post_reaction IS 'Notifica cuando alguien reacciona a un post (actualizado para usar participant_id)';

-- ============================================================================
-- CORREGIR FUNCIÓN notify_post_like
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
    liker_name TEXT;
    post_owner_id UUID;
    challenge_title TEXT;
BEGIN
    -- Obtener el dueño del post (usando participant_id en lugar de buyer_id)
    SELECT cp.participant_id, c.title INTO post_owner_id, challenge_title
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

COMMENT ON FUNCTION public.notify_post_like IS 'Notifica cuando alguien da like a un post (actualizado para usar participant_id)';

-- ============================================================================
-- CORREGIR FUNCIÓN notify_post_comment
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    commenter_name TEXT;
    post_owner_id UUID;
    challenge_title TEXT;
BEGIN
    -- Obtener el dueño del post (usando participant_id en lugar de buyer_id)
    SELECT cp.participant_id, c.title INTO post_owner_id, challenge_title
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

COMMENT ON FUNCTION public.notify_post_comment IS 'Notifica cuando alguien comenta en un post (actualizado para usar participant_id)';

-- ============================================================================
-- CORREGIR FUNCIÓN notify_team_checkin
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

    -- Obtener nombre del usuario y título del reto (usando participant_id)
    SELECT
        CONCAT(p.first_name, ' ', p.last_name),
        c.title,
        ct.team_name
    INTO member_name, challenge_title, team_name
    FROM public.challenge_purchases cp
    INNER JOIN public.profiles p ON cp.participant_id = p.id
    INNER JOIN public.challenges c ON cp.challenge_id = c.id
    INNER JOIN public.challenge_teams ct ON cp.team_id = ct.id
    WHERE cp.id = NEW.challenge_purchase_id;

    -- Obtener todos los miembros del equipo excepto el que hizo el check-in
    SELECT ARRAY_AGG(user_id) INTO team_members
    FROM public.challenge_team_members
    WHERE team_id = team_id_var
    AND user_id != (
        SELECT participant_id FROM public.challenge_purchases WHERE id = NEW.challenge_purchase_id
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
                (SELECT participant_id FROM public.challenge_purchases WHERE id = NEW.challenge_purchase_id),
                team_id_var,
                NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.notify_team_checkin IS 'Notifica cuando un miembro del equipo hace un check-in (actualizado para usar participant_id)';
