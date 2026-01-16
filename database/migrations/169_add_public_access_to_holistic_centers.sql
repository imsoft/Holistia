-- =====================================================
-- MIGRACIÓN: Permitir acceso público a centros holísticos
-- =====================================================
-- Agrega política RLS para que usuarios anónimos (no autenticados)
-- puedan ver centros holísticos activos en la página principal
-- =====================================================

-- Agregar política para usuarios anónimos (público)
CREATE POLICY IF NOT EXISTS "Public can view active holistic_centers"
ON public.holistic_centers
FOR SELECT
TO anon
USING (is_active = true);

-- También asegurar que la política para authenticated siga funcionando
-- (ya existe, pero la verificamos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'holistic_centers' 
    AND policyname = 'Everyone can view active holistic_centers'
  ) THEN
    CREATE POLICY "Everyone can view active holistic_centers"
    ON public.holistic_centers
    FOR SELECT
    TO authenticated
    USING (is_active = true);
  END IF;
END $$;
