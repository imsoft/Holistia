-- Actualizar evidence_url de .mov a .mp4 cuando hayas reemplazado el archivo en Storage
-- Ejecutar en Supabase → SQL Editor (una sola vez por cada check-in que cambiaste)

-- Opción 1: Si solo tienes UN check-in con .mov, actualiza todos los que tengan .mov en la URL
UPDATE public.challenge_checkins
SET evidence_url = REPLACE(evidence_url, '.mov', '.mp4')
WHERE evidence_url LIKE '%.mov';

-- Ver cuántas filas se actualizaron (opcional, para comprobar)
-- SELECT * FROM public.challenge_checkins WHERE evidence_url LIKE '%.mp4';
