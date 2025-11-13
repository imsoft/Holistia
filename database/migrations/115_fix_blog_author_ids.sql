-- Migration 115: Fix blog author IDs
-- Corrige los author_id en blog_posts que tienen IDs de professional_applications
-- en lugar de user_id

-- Actualizar los blog posts que tienen author_id apuntando a professional_applications.id
-- en lugar de professional_applications.user_id
UPDATE blog_posts bp
SET author_id = pa.user_id
FROM professional_applications pa
WHERE bp.author_id = pa.id::text::uuid
  AND bp.author_id != pa.user_id
  AND EXISTS (
    SELECT 1
    FROM professional_applications
    WHERE id::text::uuid = bp.author_id
  );

-- Comentario explicativo
COMMENT ON TABLE blog_posts IS 'Tabla de posts del blog. El campo author_id debe referenciar auth.users(id), que es el mismo que profiles.id y professional_applications.user_id';
