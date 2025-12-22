-- Migración 142: Eliminar columnas no utilizadas de digital_products
-- Elimina preview_url, file_format, file_size_mb y tags
-- También elimina 'course' del constraint de categoría

-- ============================================================================
-- 1. ELIMINAR ÍNDICE DE TAGS (si existe)
-- ============================================================================

DROP INDEX IF EXISTS public.idx_digital_products_tags;

-- ============================================================================
-- 2. ELIMINAR COLUMNAS NO UTILIZADAS
-- ============================================================================

-- Eliminar columna tags
ALTER TABLE public.digital_products
DROP COLUMN IF EXISTS tags;

-- Eliminar columna preview_url
ALTER TABLE public.digital_products
DROP COLUMN IF EXISTS preview_url;

-- Eliminar columna file_format
ALTER TABLE public.digital_products
DROP COLUMN IF EXISTS file_format;

-- Eliminar columna file_size_mb
ALTER TABLE public.digital_products
DROP COLUMN IF EXISTS file_size_mb;

-- ============================================================================
-- 3. ACTUALIZAR CONSTRAINT DE CATEGORÍA (eliminar 'course')
-- ============================================================================

-- Primero eliminar el constraint existente
ALTER TABLE public.digital_products
DROP CONSTRAINT IF EXISTS digital_products_category_check;

-- Crear nuevo constraint sin 'course'
ALTER TABLE public.digital_products
ADD CONSTRAINT digital_products_category_check CHECK (
  category = ANY (
    ARRAY[
      'meditation'::text,
      'ebook'::text,
      'manual'::text,
      'guide'::text,
      'audio'::text,
      'video'::text,
      'other'::text
    ]
  )
);

-- ============================================================================
-- 4. COMENTARIOS
-- ============================================================================

COMMENT ON COLUMN public.digital_products.category IS 'Tipo de producto: meditation, ebook, manual, guide, audio, video, other (course fue eliminado)';
