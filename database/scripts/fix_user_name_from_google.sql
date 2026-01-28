-- ============================================================================
-- Script para corregir el nombre completo de un usuario registrado con Google
-- ============================================================================
-- Este script extrae el nombre completo de raw_user_meta_data de Google
-- y lo divide en first_name y last_name en la tabla profiles
-- ============================================================================

DO $$
DECLARE
    user_email TEXT := 'brangarciaramos@gmail.com';
    user_id_var UUID;
    user_metadata JSONB;
    full_name TEXT;
    first_name_var TEXT;
    last_name_var TEXT;
    name_parts TEXT[];
BEGIN
    -- Obtener ID del usuario por email
    SELECT id, raw_user_meta_data INTO user_id_var, user_metadata
    FROM auth.users
    WHERE email = user_email;
    
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario con email: %', user_email;
    END IF;
    
    -- Intentar obtener el nombre completo de diferentes campos posibles de Google
    -- Google puede devolver: full_name, name, given_name + family_name
    full_name := COALESCE(
        user_metadata->>'full_name',
        user_metadata->>'name',
        NULL
    );
    
    -- Si no hay full_name, intentar combinar given_name y family_name
    IF full_name IS NULL THEN
        full_name := TRIM(
            COALESCE(user_metadata->>'given_name', '') || ' ' || 
            COALESCE(user_metadata->>'family_name', '')
        );
    END IF;
    
    -- Si aún no hay nombre, usar el email como referencia
    IF full_name IS NULL OR full_name = '' THEN
        -- Extraer nombre del email (parte antes del @)
        full_name := SPLIT_PART(user_email, '@', 1);
    END IF;
    
    -- Dividir el nombre completo en partes
    name_parts := string_to_array(TRIM(full_name), ' ');
    
    -- Asignar first_name y last_name
    IF array_length(name_parts, 1) >= 2 THEN
        -- Si hay 2 o más partes, la primera es first_name y el resto es last_name
        first_name_var := name_parts[1];
        last_name_var := array_to_string(name_parts[2:], ' ');
    ELSIF array_length(name_parts, 1) = 1 THEN
        -- Si solo hay una parte, es first_name
        first_name_var := name_parts[1];
        last_name_var := '';
    ELSE
        -- Si no hay partes, usar el email
        first_name_var := SPLIT_PART(user_email, '@', 1);
        last_name_var := '';
    END IF;
    
    -- Actualizar el perfil en la tabla profiles
    UPDATE public.profiles
    SET 
        first_name = first_name_var,
        last_name = last_name_var,
        updated_at = NOW()
    WHERE id = user_id_var;
    
    -- También actualizar raw_user_meta_data en auth.users para consistencia
    UPDATE auth.users
    SET 
        raw_user_meta_data = jsonb_set(
            jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{first_name}',
                to_jsonb(first_name_var)
            ),
            '{last_name}',
            to_jsonb(last_name_var)
        )
    WHERE id = user_id_var;
    
    -- Mostrar información de confirmación
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECCIÓN DE NOMBRE COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuario: %', user_email;
    RAISE NOTICE 'User ID: %', user_id_var;
    RAISE NOTICE '';
    RAISE NOTICE 'Nombre completo encontrado: %', full_name;
    RAISE NOTICE 'Nombre dividido:';
    RAISE NOTICE '  - first_name: %', first_name_var;
    RAISE NOTICE '  - last_name: %', last_name_var;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Perfil actualizado exitosamente';
    RAISE NOTICE '========================================';
    
END $$;

-- ============================================================================
-- VERIFICACIÓN: Consultar el perfil actualizado
-- ============================================================================

SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', p.last_name) AS nombre_completo,
    p.type,
    p.account_active,
    u.raw_user_meta_data->>'full_name' AS google_full_name,
    u.raw_user_meta_data->>'name' AS google_name,
    u.raw_user_meta_data->>'given_name' AS google_given_name,
    u.raw_user_meta_data->>'family_name' AS google_family_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'brangarciaramos@gmail.com';
