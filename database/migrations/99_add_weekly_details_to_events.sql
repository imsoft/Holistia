-- Agregar detalles de programación semanal para eventos por semanas
-- Campos opcionales: se usan solo cuando duration_unit = 'weeks'

ALTER TABLE public.events_workshops
ADD COLUMN IF NOT EXISTS weekly_days integer[] NULL,
ADD COLUMN IF NOT EXISTS weekly_hours_per_day integer NULL;

-- Validaciones simples
ALTER TABLE public.events_workshops
ADD CONSTRAINT IF NOT EXISTS events_workshops_weekly_hours_per_day_check
CHECK (weekly_hours_per_day IS NULL OR weekly_hours_per_day > 0);

-- Nota: no forzamos que weekly_days/weekly_hours_per_day estén presentes
-- cuando duration_unit = 'weeks' para mantener compatibilidad y flexibilidad.

