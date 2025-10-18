-- Actualizar políticas RLS de blog_posts
-- Versión simplificada: permite a cualquier usuario autenticado gestionar posts
-- IMPORTANTE: Esta es una política permisiva. En producción deberías restringir por roles.

-- Eliminar todas las políticas antiguas
DROP POLICY IF EXISTS "Owners can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Owners can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Owners can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Owners can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;

-- Policy: Todos pueden leer posts publicados (público y autenticados)
CREATE POLICY "Anyone can read published blog posts"
    ON public.blog_posts
    FOR SELECT
    TO authenticated, anon
    USING (status = 'published');

-- Policy: Usuarios autenticados pueden leer todos los posts
CREATE POLICY "Authenticated users can read all posts"
    ON public.blog_posts
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Cualquier usuario autenticado puede crear posts
-- NOTA: En producción, considera restringir esto solo a admins
CREATE POLICY "Authenticated users can create blog posts"
    ON public.blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Usuarios autenticados pueden actualizar posts
CREATE POLICY "Authenticated users can update blog posts"
    ON public.blog_posts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Usuarios autenticados pueden eliminar posts
CREATE POLICY "Authenticated users can delete blog posts"
    ON public.blog_posts
    FOR DELETE
    TO authenticated
    USING (true);

-- Comentarios
COMMENT ON POLICY "Anyone can read published blog posts" ON public.blog_posts
    IS 'Permite a cualquiera leer posts publicados';
COMMENT ON POLICY "Authenticated users can read all posts" ON public.blog_posts
    IS 'Usuarios autenticados pueden ver todos los posts incluidos borradores';
COMMENT ON POLICY "Authenticated users can create blog posts" ON public.blog_posts
    IS 'Permite a usuarios autenticados crear posts - considerar restringir en producción';
COMMENT ON POLICY "Authenticated users can update blog posts" ON public.blog_posts
    IS 'Permite a usuarios autenticados actualizar posts - considerar restringir en producción';
COMMENT ON POLICY "Authenticated users can delete blog posts" ON public.blog_posts
    IS 'Permite a usuarios autenticados eliminar posts - considerar restringir en producción';
