-- =====================================================
-- MIGRACIÓN: Agregar privacidad al campo phone
-- =====================================================
-- Crea una vista para que solo los admins vean el teléfono
-- Los demás usuarios no verán el campo phone
-- =====================================================

-- 1. Crear vista pública (sin teléfono)
CREATE OR REPLACE VIEW public.holistic_centers_public AS
SELECT
    id,
    name,
    description,
    address,
    city,
    email,
    website,
    instagram,
    image_url,
    opening_hours,
    is_active,
    created_at,
    updated_at
FROM public.holistic_centers
WHERE is_active = true;

-- 2. Crear vista para admins (con teléfono)
CREATE OR REPLACE VIEW public.holistic_centers_admin AS
SELECT
    id,
    name,
    description,
    address,
    city,
    phone,
    email,
    website,
    instagram,
    image_url,
    opening_hours,
    is_active,
    created_at,
    updated_at
FROM public.holistic_centers;

-- 3. Otorgar permisos a las vistas
GRANT SELECT ON public.holistic_centers_public TO authenticated;
GRANT SELECT ON public.holistic_centers_admin TO authenticated;

-- 4. Crear función para obtener centros según rol del usuario
CREATE OR REPLACE FUNCTION get_holistic_centers()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    image_url TEXT,
    opening_hours JSONB,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Si es admin, devolver con teléfono
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    ) THEN
        RETURN QUERY
        SELECT * FROM public.holistic_centers_admin;
    ELSE
        -- Si no es admin, devolver sin teléfono (phone será NULL)
        RETURN QUERY
        SELECT
            hcp.id,
            hcp.name,
            hcp.description,
            hcp.address,
            hcp.city,
            NULL::TEXT AS phone,
            hcp.email,
            hcp.website,
            hcp.instagram,
            hcp.image_url,
            hcp.opening_hours,
            hcp.is_active,
            hcp.created_at,
            hcp.updated_at
        FROM public.holistic_centers_public hcp;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_holistic_centers() TO authenticated;

-- 6. Comentarios para documentación
COMMENT ON VIEW public.holistic_centers_public IS 'Vista pública de centros holísticos sin teléfono';
COMMENT ON VIEW public.holistic_centers_admin IS 'Vista completa de centros holísticos con teléfono (solo admins)';
COMMENT ON FUNCTION get_holistic_centers() IS 'Función que devuelve centros según el rol del usuario. Admins ven teléfono, otros no.';

-- =====================================================
-- INSTRUCCIONES DE USO EN LA APLICACIÓN:
-- =====================================================
-- En lugar de:
--   supabase.from('holistic_centers').select('*')
--
-- Usar:
--   supabase.rpc('get_holistic_centers')
--
-- Esto automáticamente ocultará el teléfono para no-admins
-- =====================================================
