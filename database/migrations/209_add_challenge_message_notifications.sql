-- ============================================================================
-- MIGRACIÓN 209: Agregar notificaciones y emails para mensajes de retos
-- ============================================================================
-- Descripción: Crea notificaciones y envía emails cuando se envía un mensaje
--              en el chat de un reto
-- Características:
--   - Agrega tipo 'challenge_message' a la tabla de notificaciones
--   - Crea trigger que genera notificación automáticamente al enviar mensaje
--   - La notificación incluye información del remitente y preview del mensaje
--   - Notifica a todos los participantes del reto (excepto al remitente)
--   - Incluye al profesional creador del reto si aplica
-- ============================================================================

-- Agregar tipo 'challenge_message' a la tabla de notificaciones
DO $$
BEGIN
    -- Eliminar constraint anterior si existe
    ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

    -- Crear constraint actualizado con 'challenge_message'
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check CHECK (type IN (
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
        'badge_earned',
        'team_message',
        'post_reaction',
        'direct_message',
        'challenge_message'
    ));
EXCEPTION
    WHEN duplicate_object THEN
        -- Si el constraint ya existe, no hacer nada
        NULL;
END $$;

-- ============================================================================
-- FUNCIÓN PARA CREAR NOTIFICACIÓN DE MENSAJE DE RETO
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_challenge_message()
RETURNS TRIGGER AS $$
DECLARE
    v_challenge_id UUID;
    v_sender_name TEXT;
    v_sender_email TEXT;
    v_challenge_title TEXT;
    v_message_preview TEXT;
    v_action_url TEXT;
    v_participant_id UUID;
    v_participant_email TEXT;
    v_participant_name TEXT;
    v_creator_id UUID;
    v_creator_type TEXT;
BEGIN
    -- Obtener información de la conversación y el reto
    SELECT 
        cc.challenge_id,
        c.title,
        c.created_by_user_id,
        c.created_by_type
    INTO 
        v_challenge_id,
        v_challenge_title,
        v_creator_id,
        v_creator_type
    FROM public.challenge_conversations cc
    JOIN public.challenges c ON c.id = cc.challenge_id
    WHERE cc.id = NEW.conversation_id;

    -- Si no se encuentra el reto, salir
    IF v_challenge_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener información del remitente
    SELECT 
        COALESCE(first_name || ' ' || last_name, email, 'Usuario'),
        email
    INTO v_sender_name, v_sender_email
    FROM public.profiles
    WHERE id = NEW.sender_id;

    -- Si no se encuentra el remitente, usar valores por defecto
    IF v_sender_name IS NULL THEN
        v_sender_name := 'Usuario';
    END IF;

    -- Crear preview del mensaje (primeros 100 caracteres)
    v_message_preview := LEFT(NEW.content, 100);
    IF LENGTH(NEW.content) > 100 THEN
        v_message_preview := v_message_preview || '...';
    END IF;

    -- Construir URL de acción
    v_action_url := '/my-challenges?challenge=' || v_challenge_id::text || '#chat';

    -- Notificar a todos los participantes del reto (excepto al remitente)
    FOR v_participant_id IN
        SELECT DISTINCT participant_id
        FROM public.challenge_purchases
        WHERE challenge_id = v_challenge_id
        AND access_granted = true
        AND participant_id != NEW.sender_id
    LOOP
        -- Crear notificación para el participante
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            related_user_id,
            metadata
        ) VALUES (
            v_participant_id,
            'challenge_message',
            'Nuevo mensaje en el reto',
            v_sender_name || ': ' || v_message_preview,
            v_action_url,
            NEW.sender_id,
            jsonb_build_object(
                'challenge_id', v_challenge_id,
                'challenge_title', v_challenge_title,
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_name', v_sender_name
            )
        );
    END LOOP;

    -- Si el reto fue creado por un profesional y el profesional no es el remitente
    -- y no está ya en challenge_purchases, también notificarlo
    IF v_creator_type = 'professional' 
       AND v_creator_id IS NOT NULL 
       AND v_creator_id != NEW.sender_id
       AND NOT EXISTS (
           SELECT 1 
           FROM public.challenge_purchases 
           WHERE challenge_id = v_challenge_id 
           AND participant_id = v_creator_id
           AND access_granted = true
       ) THEN
        -- Crear notificación para el creador profesional
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            related_user_id,
            metadata
        ) VALUES (
            v_creator_id,
            'challenge_message',
            'Nuevo mensaje en tu reto',
            v_sender_name || ': ' || v_message_preview,
            v_action_url,
            NEW.sender_id,
            jsonb_build_object(
                'challenge_id', v_challenge_id,
                'challenge_title', v_challenge_title,
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_name', v_sender_name
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para notificar cuando se inserta un mensaje de reto
DROP TRIGGER IF EXISTS trigger_notify_challenge_message ON public.challenge_messages;

CREATE TRIGGER trigger_notify_challenge_message
    AFTER INSERT ON public.challenge_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_challenge_message();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION notify_challenge_message() IS 'Crea notificaciones cuando se envía un mensaje en el chat de un reto';
COMMENT ON TRIGGER trigger_notify_challenge_message ON public.challenge_messages IS 'Trigger que crea notificaciones automáticamente al enviar mensaje en reto';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
