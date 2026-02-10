-- ============================================================================
-- Migración 232: Evitar doble reserva (mismo profesional, misma fecha y hora)
-- ============================================================================
-- Índice único parcial: solo una cita activa por profesional/fecha/hora.
-- Las citas canceladas no bloquean el slot.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_professional_date_time_active
  ON public.appointments (professional_id, appointment_date, appointment_time)
  WHERE status NOT IN ('cancelled');

COMMENT ON INDEX public.idx_appointments_professional_date_time_active IS
  'Evita que dos pacientes agenden al mismo profesional en la misma fecha y hora (solo citas no canceladas).';
