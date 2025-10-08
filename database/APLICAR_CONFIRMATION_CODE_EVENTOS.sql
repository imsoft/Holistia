-- =====================================================
-- MIGRACIÓN: Agregar código de confirmación a eventos
-- =====================================================
-- Ejecutar este archivo en el SQL Editor de Supabase
-- para agregar el sistema de códigos de confirmación

-- 1. Agregar campo confirmation_code a event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS confirmation_code TEXT UNIQUE;

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_event_registrations_confirmation_code ON public.event_registrations(confirmation_code);

-- 3. Agregar constraint para validar que el código no esté vacío
ALTER TABLE public.event_registrations 
ADD CONSTRAINT event_registrations_confirmation_code_not_empty 
CHECK (confirmation_code IS NULL OR LENGTH(TRIM(confirmation_code)) > 0);

-- 4. Función para generar código único de 8 caracteres
CREATE OR REPLACE FUNCTION generate_event_confirmation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generar código alfanumérico de 8 caracteres
        code := UPPER(
            SUBSTRING(
                MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 
                1, 8
            )
        );
        
        -- Verificar si el código ya existe
        SELECT COUNT(*) INTO exists_count 
        FROM public.event_registrations 
        WHERE confirmation_code = code;
        
        -- Si el código no existe, devolverlo
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Función trigger para generar código automáticamente
CREATE OR REPLACE FUNCTION set_event_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo generar código cuando el status cambie a 'confirmed' y no exista código
    IF NEW.status = 'confirmed' AND (OLD.status != 'confirmed' OR OLD.status IS NULL) AND NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := generate_event_confirmation_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger
DROP TRIGGER IF EXISTS trigger_set_event_confirmation_code ON public.event_registrations;
CREATE TRIGGER trigger_set_event_confirmation_code
    BEFORE UPDATE ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION set_event_confirmation_code();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que todo funciona correctamente:

-- 1. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'event_registrations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Probar la función de generación de código
SELECT generate_event_confirmation_code() as test_code;

-- 3. Ver registros existentes (si los hay)
SELECT id, event_id, user_id, status, confirmation_code, registration_date
FROM public.event_registrations
ORDER BY registration_date DESC
LIMIT 5;
