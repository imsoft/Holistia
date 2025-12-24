-- =====================================================
-- MIGRACIÓN 21: Sistema de Configuración de Privacidad
-- =====================================================
-- Descripción: Controles granulares de privacidad para usuarios
-- =====================================================

-- Tabla de configuración de privacidad
CREATE TABLE IF NOT EXISTS public.privacy_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Visibilidad de perfil
    profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers', 'private')),

    -- Qué puede ver la gente en tu perfil
    show_challenges BOOLEAN DEFAULT true,
    show_stats BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,
    show_followers BOOLEAN DEFAULT true,
    show_activity BOOLEAN DEFAULT true,

    -- Quién puede interactuar contigo
    who_can_follow TEXT NOT NULL DEFAULT 'everyone' CHECK (who_can_follow IN ('everyone', 'no_one')),
    who_can_message TEXT NOT NULL DEFAULT 'everyone' CHECK (who_can_message IN ('everyone', 'followers', 'no_one')),
    who_can_see_posts TEXT NOT NULL DEFAULT 'everyone' CHECK (who_can_see_posts IN ('everyone', 'followers', 'private')),
    who_can_comment TEXT NOT NULL DEFAULT 'everyone' CHECK (who_can_comment IN ('everyone', 'followers', 'no_one')),

    -- Notificaciones
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    notify_on_follow BOOLEAN DEFAULT true,
    notify_on_like BOOLEAN DEFAULT true,
    notify_on_comment BOOLEAN DEFAULT true,
    notify_on_team_invite BOOLEAN DEFAULT true,
    notify_on_challenge_update BOOLEAN DEFAULT true,

    -- Privacidad de datos
    allow_search_by_email BOOLEAN DEFAULT false,
    allow_search_by_name BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un usuario solo puede tener una configuración de privacidad
    CONSTRAINT unique_privacy_settings_per_user UNIQUE (user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Solo el usuario puede ver y modificar su configuración de privacidad
CREATE POLICY "Los usuarios pueden ver su propia configuración de privacidad"
    ON public.privacy_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar su propia configuración de privacidad"
    ON public.privacy_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar su propia configuración de privacidad"
    ON public.privacy_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para crear configuración de privacidad por defecto al crear un usuario
CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear configuración de privacidad automáticamente
DROP TRIGGER IF EXISTS trigger_create_default_privacy_settings ON auth.users;
CREATE TRIGGER trigger_create_default_privacy_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_privacy_settings();

-- Función para verificar si un usuario puede ver el perfil de otro
CREATE OR REPLACE FUNCTION public.can_view_profile(
    viewer_id UUID,
    profile_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    privacy_level TEXT;
    is_follower BOOLEAN;
BEGIN
    -- Si el viewer es el mismo usuario, siempre puede ver
    IF viewer_id = profile_user_id THEN
        RETURN TRUE;
    END IF;

    -- Obtener configuración de privacidad
    SELECT profile_visibility INTO privacy_level
    FROM public.privacy_settings
    WHERE user_id = profile_user_id;

    -- Si no hay configuración, asumir público
    IF privacy_level IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Si es público, todos pueden ver
    IF privacy_level = 'public' THEN
        RETURN TRUE;
    END IF;

    -- Si es privado, nadie puede ver
    IF privacy_level = 'private' THEN
        RETURN FALSE;
    END IF;

    -- Si es solo seguidores, verificar
    IF privacy_level = 'followers' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.user_follows
            WHERE follower_id = viewer_id
            AND following_id = profile_user_id
        ) INTO is_follower;

        RETURN is_follower;
    END IF;

    -- Por defecto, no permitir
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede ver posts de otro
CREATE OR REPLACE FUNCTION public.can_view_posts(
    viewer_id UUID,
    post_owner_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    privacy_level TEXT;
    is_follower BOOLEAN;
BEGIN
    -- Si el viewer es el mismo usuario, siempre puede ver
    IF viewer_id = post_owner_id THEN
        RETURN TRUE;
    END IF;

    -- Obtener configuración de privacidad
    SELECT who_can_see_posts INTO privacy_level
    FROM public.privacy_settings
    WHERE user_id = post_owner_id;

    -- Si no hay configuración, asumir público
    IF privacy_level IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Si es público, todos pueden ver
    IF privacy_level = 'everyone' THEN
        RETURN TRUE;
    END IF;

    -- Si es privado, nadie puede ver
    IF privacy_level = 'private' THEN
        RETURN FALSE;
    END IF;

    -- Si es solo seguidores, verificar
    IF privacy_level = 'followers' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.user_follows
            WHERE follower_id = viewer_id
            AND following_id = post_owner_id
        ) INTO is_follower;

        RETURN is_follower;
    END IF;

    -- Por defecto, no permitir
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.privacy_settings IS 'Configuración de privacidad granular por usuario';
COMMENT ON FUNCTION public.can_view_profile IS 'Verifica si un usuario puede ver el perfil de otro según configuración de privacidad';
COMMENT ON FUNCTION public.can_view_posts IS 'Verifica si un usuario puede ver los posts de otro según configuración de privacidad';
