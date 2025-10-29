-- Agregar columna day_of_week a availability_blocks
ALTER TABLE availability_blocks 
ADD COLUMN IF NOT EXISTS day_of_week INTEGER;

-- Agregar comentario para explicar el uso
COMMENT ON COLUMN availability_blocks.day_of_week IS 'Día de la semana (1=Lunes, 2=Martes, ..., 7=Domingo) para bloqueos semanales';

-- Eliminar la constraint antigua
ALTER TABLE availability_blocks 
DROP CONSTRAINT IF EXISTS availability_blocks_block_type_check;

-- Agregar la nueva constraint con los nuevos tipos
ALTER TABLE availability_blocks 
ADD CONSTRAINT availability_blocks_block_type_check 
CHECK (block_type = ANY (ARRAY['full_day'::text, 'time_range'::text, 'weekly_day'::text, 'weekly_range'::text]));

-- Actualizar tipos de bloqueo existentes si es necesario
-- Los bloqueos existentes mantendrán su comportamiento actual
