-- Eliminar foreign key constraint de author_id en blog_posts
-- Esto permite que author_id pueda referenciar tanto a auth.users como a professional_applications
-- IMPORTANTE: Al eliminar el constraint, perdemos la integridad referencial automática

-- Eliminar el constraint de foreign key
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Comentario explicativo
COMMENT ON COLUMN public.blog_posts.author_id IS
'UUID del autor - puede ser un usuario de auth.users o un profesional de professional_applications. Sin constraint FK para permitir flexibilidad.';

-- NOTA: Sin el constraint de FK, es responsabilidad de la aplicación asegurar que:
-- 1. El author_id existe en auth.users O en professional_applications
-- 2. Al eliminar un autor, se manejen apropiadamente los posts huérfanos
