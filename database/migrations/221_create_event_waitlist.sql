-- Migración 221: Lista de espera para eventos llenos
-- Permite apuntarse cuando el evento está lleno y notificar si se libera cupo o si no hubo cupos.

-- Tabla event_waitlist: usuarios en lista de espera por evento
CREATE TABLE IF NOT EXISTS public.event_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events_workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Cuando se notificó que había cupo disponible (null = aún no)
  notified_spot_available_at TIMESTAMPTZ,
  -- Cuando se notificó que el evento pasó sin liberar cupo (null = aún no)
  notified_no_spot_at TIMESTAMPTZ,
  CONSTRAINT event_waitlist_event_user_unique UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_event_id ON public.event_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_user_id ON public.event_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_notified ON public.event_waitlist(event_id, notified_spot_available_at) WHERE notified_spot_available_at IS NULL;

COMMENT ON TABLE public.event_waitlist IS 'Lista de espera para eventos con cupo lleno; se notifica si se libera cupo o si el evento pasó sin cupos';

ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;

-- Usuarios ven solo su propia entrada en la lista de espera
CREATE POLICY "Users can view own waitlist entries"
  ON public.event_waitlist FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden apuntarse a la lista (insertar su propio user_id)
CREATE POLICY "Users can insert own waitlist entry"
  ON public.event_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins y organizadores del evento pueden ver toda la lista (para gestión)
CREATE POLICY "Admins can view all waitlist"
  ON public.event_waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.type = 'admin'
    )
  );

CREATE POLICY "Event owners can view waitlist"
  ON public.event_waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events_workshops ew
      JOIN public.professional_applications pa ON pa.id = ew.professional_id
      WHERE ew.id = event_waitlist.event_id AND pa.user_id = auth.uid()
    )
  );

-- Solo el sistema (service role) o admins deben poder actualizar notified_* (vía API/server). RLS: admins pueden update para marcar notificaciones si se hace desde el panel.
CREATE POLICY "Admins can update waitlist"
  ON public.event_waitlist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.type = 'admin'
    )
  );

-- Tipos de notificación para lista de espera
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
    'event_no_spot_available'
  ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
