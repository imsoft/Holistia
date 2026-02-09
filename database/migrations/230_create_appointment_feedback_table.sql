-- Migración 230: tabla de feedback/encuesta post-cita ("¿Todo bien con tu reserva?")
-- Un registro por cita (appointment_id único). Solo para citas completadas.

CREATE TABLE IF NOT EXISTS public.appointment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 3),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appointment_feedback_appointment_unique UNIQUE (appointment_id)
);

COMMENT ON TABLE public.appointment_feedback IS 'Encuesta corta post-cita: 1=Todo bien, 2=Más o menos, 3=No';
COMMENT ON COLUMN public.appointment_feedback.rating IS '1=Todo bien, 2=Más o menos, 3=No';

CREATE INDEX IF NOT EXISTS idx_appointment_feedback_appointment_id ON public.appointment_feedback(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_feedback_patient_id ON public.appointment_feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_feedback_created_at ON public.appointment_feedback(created_at DESC);

ALTER TABLE public.appointment_feedback ENABLE ROW LEVEL SECURITY;

-- El paciente puede insertar su propio feedback (solo para sus citas)
CREATE POLICY "Patients can insert own appointment feedback"
ON public.appointment_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = patient_id
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_id AND a.patient_id = auth.uid() AND a.status = 'completed'
  )
);

-- El usuario puede ver su propio feedback
CREATE POLICY "Users can view own appointment feedback"
ON public.appointment_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

-- Admins pueden ver todo el feedback
CREATE POLICY "Admins can view all appointment feedback"
ON public.appointment_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.type = 'admin'
  )
);

-- El profesional de la cita puede ver el feedback de esa cita
CREATE POLICY "Professionals can view feedback for their appointments"
ON public.appointment_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.professional_applications pa ON pa.id = a.professional_id
    WHERE a.id = appointment_feedback.appointment_id AND pa.user_id = auth.uid()
  )
);
