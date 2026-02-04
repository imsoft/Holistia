-- Migración 219: agregar tipos de notificación para eventos
-- - event_reminder: recordatorio previo al evento
-- - event_updated: cambio de fecha u horario
-- - event_cancelled: evento cancelado

DO $$
BEGIN
    ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

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
        'challenge_message',
        'event_reminder',
        'event_updated',
        'event_cancelled'
    ));
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
