-- =====================================================
-- CORREGIR VALORES DE SESSION_TYPE
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. ELIMINAR CONSTRAINT EXISTENTE
ALTER TABLE public.events_workshops 
DROP CONSTRAINT IF EXISTS events_workshops_session_type_check;

-- 2. AGREGAR NUEVO CONSTRAINT CON VALORES CORRECTOS
ALTER TABLE public.events_workshops 
ADD CONSTRAINT events_workshops_session_type_check 
CHECK (session_type IN ('unique', 'recurring'));

-- 3. VERIFICAR QUE SE APLICÓ
SELECT 'Constraint actualizado:' as status, conname, contype
FROM pg_constraint 
WHERE conname = 'events_workshops_session_type_check';
