-- Migración 220: tabla de feedback/encuesta post-evento
-- Un registro por inscripción (event_registration_id único).

CREATE TABLE IF NOT EXISTS public.event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events_workshops(id) ON DELETE CASCADE,
  event_registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_feedback_registration_unique UNIQUE (event_registration_id)
);

CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON public.event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON public.event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_created_at ON public.event_feedback(created_at DESC);

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

-- El usuario puede insertar su propio feedback (solo el suyo)
CREATE POLICY "Users can insert own event feedback"
ON public.event_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- El usuario puede ver su propio feedback
CREATE POLICY "Users can view own event feedback"
ON public.event_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins pueden ver todo el feedback
CREATE POLICY "Admins can view all event feedback"
ON public.event_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.type = 'admin'
  )
);

-- Organizador del evento (professional_id) puede ver feedback de su evento
CREATE POLICY "Event organizers can view event feedback"
ON public.event_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events_workshops ew
    JOIN public.professional_applications pa ON pa.id = ew.professional_id
    WHERE ew.id = event_feedback.event_id AND pa.user_id = auth.uid()
  )
);

COMMENT ON TABLE public.event_feedback IS 'Encuesta/feedback post-evento por inscripción';
COMMENT ON COLUMN public.event_feedback.rating IS 'Valoración 1-5 estrellas';
COMMENT ON COLUMN public.event_feedback.comment IS 'Comentario opcional del participante';
