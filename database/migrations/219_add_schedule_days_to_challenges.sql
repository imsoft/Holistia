-- Migración 219: Agregar días de compromiso a retos
-- Permite que el creador sugiera días de la semana y el participante confirme/ajuste los suyos.
-- Convención: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado

-- Días sugeridos por el profesional/creador al crear o editar el reto (opcional)
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS suggested_schedule_days integer[] DEFAULT NULL;

-- Días confirmados por el participante al unirse al reto (puede diferir de la sugerencia)
ALTER TABLE challenge_purchases
  ADD COLUMN IF NOT EXISTS schedule_days integer[] DEFAULT NULL;

COMMENT ON COLUMN challenges.suggested_schedule_days IS
  'Días de la semana sugeridos por el creador del reto (0=Dom,1=Lun,...,6=Sáb). Opcional.';

COMMENT ON COLUMN challenge_purchases.schedule_days IS
  'Días de la semana en que el participante se compromete a hacer check-in (0=Dom,1=Lun,...,6=Sáb). Opcional.';
