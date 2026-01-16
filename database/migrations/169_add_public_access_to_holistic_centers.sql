-- =====================================================
-- MIGRACIÓN: Permitir acceso público a centros holísticos
-- =====================================================
-- Agrega política RLS para que usuarios anónimos (no autenticados)
-- puedan ver centros holísticos activos en la página principal
-- =====================================================

-- Eliminar política si existe (para permitir re-ejecución)
DROP POLICY IF EXISTS "Public can view active holistic_centers" ON public.holistic_centers;

-- Agregar política para usuarios anónimos (público)
CREATE POLICY "Public can view active holistic_centers"
ON public.holistic_centers
FOR SELECT
TO anon
USING (is_active = true);
