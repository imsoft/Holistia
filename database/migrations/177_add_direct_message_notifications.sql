-- ============================================================================
-- MIGRACIÓN 177: Agregar notificaciones para mensajes directos
-- ============================================================================
-- Descripción: Crea notificaciones cuando llega un nuevo mensaje directo
-- Características:
--   - Agrega tipo 'direct_message' a la tabla de notificaciones
--   - Crea trigger que genera notificación automáticamente al recibir mensaje
--   - La notificación incluye información del remitente y preview del mensaje
-- ============================================================================

-- Agregar tipo 'direct_message' a la tabla de notificaciones
DO $$
BEGIN
    -- Eliminar constraint anterior si existe
    ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

    -- Crear constraint actualizado con 'direct_message'
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
        'direct_message'
    ));
EXCEPTION
    WHEN duplicate_object THEN
        -- Si el constraint ya existe, no hacer nada
        NULL;
END $$;

-- ============================================================================
-- FUNCIÓN PARA CREAR NOTIFICACIÓN DE MENSAJE DIRECTO
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_direct_message()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_professional_id UUID;
    v_sender_type TEXT;
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_sender_avatar TEXT;
    v_message_preview TEXT;
    v_action_url TEXT;
BEGIN
    -- Obtener información de la conversación
    SELECT user_id, professional_id INTO v_user_id, v_professional_id
    FROM public.direct_conversations
    WHERE id = NEW.conversation_id;

    -- Determinar tipo de remitente y receptor
    IF NEW.sender_id = v_user_id THEN
        v_sender_type := 'user';
        v_recipient_id := (
            SELECT user_id 
            FROM public.professional_applications 
            WHERE id = v_professional_id
        );
    ELSE
        v_sender_type := 'professional';
        v_recipient_id := v_user_id;
    END IF;

    -- Si no hay receptor, salir
    IF v_recipient_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener información del remitente
    SELECT 
        COALESCE(first_name || ' ' || last_name, email, 'Usuario'),
        avatar_url
    INTO v_sender_name, v_sender_avatar
    FROM public.profiles
    WHERE id = NEW.sender_id;

    -- Crear preview del mensaje (primeros 100 caracteres)
    v_message_preview := LEFT(NEW.content, 100);
    IF LENGTH(NEW.content) > 100 THEN
        v_message_preview := v_message_preview || '...';
    END IF;

    -- Determinar URL de acción según el tipo de receptor
    -- Verificar si el receptor es profesional
    IF EXISTS (
        SELECT 1 FROM public.professional_applications 
        WHERE user_id = v_recipient_id AND id = v_professional_id
    ) THEN
        -- Receptor es profesional
        v_action_url := '/messages?conversation=' || NEW.conversation_id::text;
    ELSE
        -- Receptor es paciente
        v_action_url := '/messages?conversation=' || NEW.conversation_id::text;
    END IF;

    -- Crear notificación para el receptor
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        related_user_id,
        metadata
    ) VALUES (
        v_recipient_id,
        'direct_message',
        CASE 
            WHEN v_sender_type = 'professional' THEN 'Nuevo mensaje de experto'
            ELSE 'Nuevo mensaje'
        END,
        v_sender_name || ': ' || v_message_preview,
        v_action_url,
        NEW.sender_id,
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'message_id', NEW.id,
            'sender_type', v_sender_type
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para notificar cuando se inserta un mensaje directo
DROP TRIGGER IF EXISTS trigger_notify_direct_message ON public.direct_messages;

CREATE TRIGGER trigger_notify_direct_message
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_direct_message();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION notify_direct_message() IS 'Crea una notificación cuando se recibe un nuevo mensaje directo';
COMMENT ON TRIGGER trigger_notify_direct_message ON public.direct_messages IS 'Trigger que crea notificación automáticamente al recibir mensaje';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
