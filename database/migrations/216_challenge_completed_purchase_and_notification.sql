-- ============================================================================
-- MIGRACIÓN 216: Completar reto - actualizar challenge_purchases y notificación
-- ============================================================================
-- Cuando el participante completa todos los días del reto:
-- 1. Actualiza challenge_purchases.completed_at
-- 2. Crea notificación 'challenge_completed' para el participante
-- ============================================================================

CREATE OR REPLACE FUNCTION on_challenge_progress_completed()
RETURNS TRIGGER AS $$
DECLARE
    v_participant_id UUID;
    v_challenge_title TEXT;
    v_action_url TEXT;
BEGIN
    -- Solo actuar cuando status pasa a 'completed'
    IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
        -- Obtener participant_id y título del reto
        SELECT cp.participant_id, c.title
        INTO v_participant_id, v_challenge_title
        FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON c.id = cp.challenge_id
        WHERE cp.id = NEW.challenge_purchase_id;

        IF v_participant_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- 1. Actualizar completed_at en challenge_purchases
        UPDATE public.challenge_purchases
        SET completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.challenge_purchase_id;

        -- 2. Crear notificación para el participante
        v_action_url := '/my-challenges?challenge=' || NEW.challenge_purchase_id::TEXT;

        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            metadata
        ) VALUES (
            v_participant_id,
            'challenge_completed',
            '¡Reto completado!',
            'Felicidades, completaste el reto "' || COALESCE(v_challenge_title, 'Tu reto') || '"',
            v_action_url,
            jsonb_build_object(
                'challenge_purchase_id', NEW.challenge_purchase_id,
                'challenge_title', v_challenge_title,
                'completed_at', NEW.completed_at
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: después de actualizar challenge_progress
DROP TRIGGER IF EXISTS trigger_on_challenge_progress_completed ON public.challenge_progress;
CREATE TRIGGER trigger_on_challenge_progress_completed
    AFTER UPDATE ON public.challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION on_challenge_progress_completed();

COMMENT ON FUNCTION on_challenge_progress_completed IS
    'Al completar un reto: actualiza challenge_purchases.completed_at y crea notificación challenge_completed';
