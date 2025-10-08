-- =====================================================
-- MIGRACIÓN: Agregar campo program_duration a servicios
-- =====================================================
-- Fecha: $(date)
-- Descripción: Agregar campo para duración de programas/paquetes

-- 1. Agregar campo program_duration a la tabla professional_services
ALTER TABLE public.professional_services 
ADD COLUMN program_duration JSONB;

-- 2. Agregar comentario para documentar el campo
COMMENT ON COLUMN public.professional_services.program_duration IS 'Duración del programa/paquete en formato JSONB: {"value": number, "unit": "meses|semanas|dias|horas"}';

-- 3. Crear índice para consultas eficientes en program_duration
CREATE INDEX IF NOT EXISTS idx_professional_services_program_duration 
ON public.professional_services USING GIN (program_duration);

-- 4. Verificar que la migración se aplicó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professional_services' 
AND column_name = 'program_duration';

-- 5. Verificar el índice
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'professional_services' 
AND indexname = 'idx_professional_services_program_duration';

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Verificar que no hay errores
-- 3. Confirmar que los campos se crearon correctamente
-- 4. Los RLS policies existentes seguirán funcionando
-- =====================================================
