-- Agregar soporte para 'weeks' en events_workshops.duration_unit
-- y ampliar el límite de duration_hours para cubrir programas por semanas

-- 1) Actualizar constraint de duration_unit para incluir 'weeks'
ALTER TABLE public.events_workshops 
DROP CONSTRAINT IF EXISTS events_workshops_duration_unit_check;

ALTER TABLE public.events_workshops 
ADD CONSTRAINT events_workshops_duration_unit_check 
CHECK ((duration_unit)::text = ANY ((ARRAY['hours'::varchar, 'days'::varchar, 'weeks'::varchar])::text[]));

-- 2) Ampliar el límite de duration_hours (antes: <= 720)
ALTER TABLE public.events_workshops 
DROP CONSTRAINT IF EXISTS events_workshops_duration_hours_check;

-- Permitir hasta 5,000 horas para cubrir programas extensos (≈ 208 días)
ALTER TABLE public.events_workshops 
ADD CONSTRAINT events_workshops_duration_hours_check 
CHECK (duration_hours > 0 AND duration_hours <= 5000);

-- Nota: No es necesario agregar columnas nuevas; el frontend calcula y guarda
-- el total de horas en duration_hours y mantiene duration_unit = 'weeks'.

