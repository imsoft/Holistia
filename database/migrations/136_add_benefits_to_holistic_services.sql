-- Migración 136: Agregar campo de beneficios a servicios holísticos
-- Permite que los servicios holísticos tengan una lista de beneficios personalizados

-- 1. Agregar columna benefits como JSON array si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'holistic_services'
        AND column_name = 'benefits'
    ) THEN
        ALTER TABLE public.holistic_services
        ADD COLUMN benefits JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Comentario
COMMENT ON COLUMN public.holistic_services.benefits IS 'Lista de beneficios del servicio en formato JSON array';

-- 3. Constraint para validar que benefits sea un array
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.relname = 'holistic_services'
        AND c.conname = 'benefits_is_array'
    ) THEN
        ALTER TABLE public.holistic_services
        ADD CONSTRAINT benefits_is_array CHECK (jsonb_typeof(benefits) = 'array');
    END IF;
END $$;

-- Ejemplo de uso:
-- UPDATE holistic_services
-- SET benefits = '["Mejora el bienestar general", "Reduce el estrés", "Aumenta la productividad"]'::jsonb
-- WHERE id = 'some-uuid';
