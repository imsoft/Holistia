-- Migración 234: Tipo de notificación para pago de cotización
-- Permite notificar al profesional cuando un paciente paga una cotización.

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
    'event_cancelled',
    'event_spot_available',
    'event_no_spot_available',
    'appointment_reminder',
    'quote_payment'
  ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.notifications.type IS 'Incluye quote_payment: notificación al profesional cuando un paciente paga una cotización';
