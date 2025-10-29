-- Agregar columna day_of_week a availability_blocks
ALTER TABLE availability_blocks 
ADD COLUMN day_of_week INTEGER;

-- Agregar comentario para explicar el uso
COMMENT ON COLUMN availability_blocks.day_of_week IS 'Día de la semana (1=Lunes, 2=Martes, ..., 7=Domingo) para bloqueos semanales';

-- Actualizar tipos de bloqueo existentes si es necesario
-- Los bloqueos existentes mantendrán su comportamiento actual
