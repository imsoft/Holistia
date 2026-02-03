-- Actualizar evidence_url de .mov a .mp4 cuando hayas reemplazado el archivo en Storage
-- Ejecutar en Supabase → SQL Editor

-- 1) VER: comprobar si aún hay URLs con .mov (ejecuta esto primero)
-- SELECT id, day_number, evidence_url FROM public.challenge_checkins WHERE evidence_url LIKE '%.mov';

-- 2) ACTUALIZAR: cambiar .mov → .mp4 en la URL
UPDATE public.challenge_checkins
SET evidence_url = REPLACE(evidence_url, '.mov', '.mp4')
WHERE evidence_url LIKE '%.mov';

-- 3) VERIFICAR: deberían salir las filas ya con .mp4
-- SELECT id, day_number, evidence_url FROM public.challenge_checkins WHERE evidence_url LIKE '%.mp4';
