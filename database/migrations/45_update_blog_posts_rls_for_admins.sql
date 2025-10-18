-- Actualizar políticas RLS de blog_posts para permitir que los administradores gestionen posts
-- Usa auth.users y user_metadata directamente, sin tabla profiles

-- Eliminar políticas antiguas que referencian a 'owner' o 'profiles'
DROP POLICY IF EXISTS "Owners can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Owners can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Owners can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Owners can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;

-- Función helper para verificar si un usuario es administrador
-- Verifica el campo 'role' en user_metadata de auth.users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Todos pueden leer posts publicados
CREATE POLICY "Anyone can read published blog posts"
    ON public.blog_posts
    FOR SELECT
    TO authenticated, anon
    USING (status = 'published');

-- Policy: Usuarios autenticados pueden leer todos los posts si son admin
CREATE POLICY "Admins can read all blog posts"
    ON public.blog_posts
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Solo administradores pueden crear posts
CREATE POLICY "Admins can create blog posts"
    ON public.blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Policy: Solo administradores pueden actualizar posts
CREATE POLICY "Admins can update blog posts"
    ON public.blog_posts
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policy: Solo administradores pueden eliminar posts
CREATE POLICY "Admins can delete blog posts"
    ON public.blog_posts
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Comentarios
COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario actual tiene role=admin en user_metadata';
COMMENT ON POLICY "Admins can create blog posts" ON public.blog_posts IS 'Permite a los administradores crear posts de blog';
COMMENT ON POLICY "Admins can update blog posts" ON public.blog_posts IS 'Permite a los administradores actualizar cualquier post de blog';
COMMENT ON POLICY "Admins can delete blog posts" ON public.blog_posts IS 'Permite a los administradores eliminar cualquier post de blog';
