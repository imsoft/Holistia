-- Migración 205: Mejorar manejo de nombres de usuarios registrados con Google OAuth
-- Problema: Google OAuth puede devolver el nombre en diferentes campos (full_name, name, given_name/family_name)
-- Solución: Actualizar el trigger para manejar todos los casos posibles

-- ============================================================================
-- ACTUALIZAR FUNCIÓN handle_new_user PARA MEJOR MANEJO DE GOOGLE OAUTH
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name_val TEXT;
    last_name_val TEXT;
    full_name_val TEXT;
    name_parts TEXT[];
BEGIN
    -- Intentar obtener el nombre completo de diferentes campos posibles de Google
    -- Google puede devolver: full_name, name, given_name + family_name
    full_name_val := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULL
    );
    
    -- Si no hay full_name, intentar combinar given_name y family_name
    IF full_name_val IS NULL OR full_name_val = '' THEN
        full_name_val := TRIM(
            COALESCE(NEW.raw_user_meta_data->>'given_name', '') || ' ' || 
            COALESCE(NEW.raw_user_meta_data->>'family_name', '')
        );
    END IF;
    
    -- Si hay nombre completo, dividirlo en partes
    IF full_name_val IS NOT NULL AND full_name_val != '' THEN
        name_parts := string_to_array(TRIM(full_name_val), ' ');
        
        IF array_length(name_parts, 1) >= 2 THEN
            -- Si hay 2 o más partes, la primera es first_name y el resto es last_name
            first_name_val := name_parts[1];
            last_name_val := array_to_string(name_parts[2:], ' ');
        ELSIF array_length(name_parts, 1) = 1 THEN
            -- Si solo hay una parte, es first_name
            first_name_val := name_parts[1];
            last_name_val := '';
        END IF;
    END IF;
    
    -- Si aún no hay nombres, usar los campos directos o valores por defecto
    IF first_name_val IS NULL OR first_name_val = '' THEN
        first_name_val := COALESCE(
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'given_name',
            ''
        );
    END IF;
    
    IF last_name_val IS NULL OR last_name_val = '' THEN
        last_name_val := COALESCE(
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'family_name',
            ''
        );
    END IF;
    
    -- Si aún no hay nombres, extraer del email como último recurso
    IF (first_name_val IS NULL OR first_name_val = '') AND (last_name_val IS NULL OR last_name_val = '') THEN
        first_name_val := SPLIT_PART(NEW.email, '@', 1);
        last_name_val := '';
    END IF;
    
    -- Crear el perfil
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        type,
        account_active,
        deactivated_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(first_name_val, ''),
        COALESCE(last_name_val, ''),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        ),
        COALESCE(NEW.raw_user_meta_data->>'type', 'patient'),
        true,
        NULL,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Si el perfil ya existe, no hacer nada
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error pero no fallar
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Crea automáticamente un perfil cuando se registra un usuario. Maneja correctamente nombres de Google OAuth (full_name, name, given_name/family_name)';
