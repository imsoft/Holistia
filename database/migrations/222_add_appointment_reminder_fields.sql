-- Migración 222: Recordatorios de cita (24 h y 1 h antes) para paciente y profesional

-- Campos en appointments para no enviar el mismo recordatorio dos veces
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_24h_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_1h_at TIMESTAMPTZ;

COMMENT ON COLUMN public.appointments.reminder_sent_24h_at IS 'Cuando se envió el recordatorio 24 h antes (email + notificación)';
COMMENT ON COLUMN public.appointments.reminder_sent_1h_at IS 'Cuando se envió el recordatorio 1 h antes (email + notificación)';

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_24h
  ON public.appointments(appointment_date, appointment_time)
  WHERE status = 'confirmed' AND reminder_sent_24h_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_1h
  ON public.appointments(appointment_date, appointment_time)
  WHERE status = 'confirmed' AND reminder_sent_1h_at IS NULL;

-- Tipo de notificación para recordatorio de cita
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
    'appointment_reminder'
  ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
