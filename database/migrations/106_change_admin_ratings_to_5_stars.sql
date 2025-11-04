-- =====================================================
-- MIGRACIÓN 106: Cambiar escala de calificación de 0-10 a 0-5 estrellas
-- =====================================================
-- Fecha: Diciembre 2024
-- Propósito: Cambiar la escala de calificación de administradores
--            de 0-10 a 0-5 estrellas para mayor consistencia
-- =====================================================

-- 1. Primero, escalar todas las calificaciones existentes de 0-10 a 0-5
-- Esto convierte: 10 → 5, 8 → 4, 6 → 3, 4 → 2, 2 → 1, 0 → 0
UPDATE public.admin_ratings 
SET rating = CASE 
  WHEN rating > 5 THEN (rating / 2.0)
  ELSE rating
END
WHERE rating > 5;

-- 2. Ahora actualizar el CHECK constraint del rating
-- Primero, necesitamos eliminar el constraint existente
ALTER TABLE public.admin_ratings
  DROP CONSTRAINT IF EXISTS admin_ratings_rating_check;

-- Crear nuevo constraint para 0-5 estrellas
ALTER TABLE public.admin_ratings
  ADD CONSTRAINT admin_ratings_rating_check 
  CHECK (rating >= 0 AND rating <= 5);

-- 3. Actualizar comentarios de documentación
COMMENT ON COLUMN public.admin_ratings.rating IS 
'Calificación del 0 al 5 estrellas';

COMMENT ON TABLE public.admin_ratings IS 
'Calificaciones de administradores para profesionales. Escala 0-5 estrellas con comentarios sobre mejoras';

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Si hay calificaciones existentes con valores > 5, 
-- deberán ser actualizadas manualmente antes de ejecutar esta migración.
-- Ejemplo para escalar valores existentes de 0-10 a 0-5:
-- UPDATE public.admin_ratings SET rating = (rating / 2.0);
-- =====================================================
