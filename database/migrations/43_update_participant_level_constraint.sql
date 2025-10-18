-- Actualizar el constraint de participant_level para incluir 'todos'
-- Primero, eliminar el constraint existente
ALTER TABLE public.events_workshops
DROP CONSTRAINT IF EXISTS events_workshops_participant_level_check;

-- Crear el nuevo constraint que incluye 'todos'
ALTER TABLE public.events_workshops
ADD CONSTRAINT events_workshops_participant_level_check
CHECK (participant_level IN ('todos', 'principiante', 'medio', 'avanzado'));

-- Comentario explicativo
COMMENT ON CONSTRAINT events_workshops_participant_level_check ON public.events_workshops
IS 'Nivel requerido del participante: todos (cualquier nivel), principiante, medio o avanzado';
