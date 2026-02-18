-- Migración 236: Agregar horario por día de la semana a professional_applications
-- Permite configurar un horario diferente para cada día laboral (ej: Lun 9-18, Sáb 10-14)
--
-- Estructura del JSONB:
-- {
--   "1": {"start": "09:00", "end": "18:00"},   <- Lunes
--   "2": {"start": "09:00", "end": "18:00"},   <- Martes
--   "6": {"start": "10:00", "end": "14:00"}    <- Sábado
-- }
-- Solo se almacenan los días que están en working_days.
-- Si per_day_schedule es NULL, se usan working_start_time / working_end_time como fallback.

ALTER TABLE professional_applications
  ADD COLUMN IF NOT EXISTS per_day_schedule JSONB DEFAULT NULL;

-- Comentario de documentación
COMMENT ON COLUMN professional_applications.per_day_schedule IS
  'Horario por día de la semana (clave = número de día 1-7, valor = {start, end}). NULL = usar working_start_time/working_end_time para todos los días.';
