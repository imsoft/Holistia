-- ============================================================================
-- MIGRACIÓN 183: Corregir visibilidad de productos digitales
-- ============================================================================
-- Fecha: 2026-01-16
-- Propósito: Permitir que productos de profesionales aprobados sean visibles
--            incluso si el profesional no está verificado (is_verified)
-- ============================================================================

-- Eliminar política antigua que requiere verificación
DROP POLICY IF EXISTS "Public can view active products from verified professionals" ON public.digital_products;

-- Nueva política: productos de profesionales aprobados son visibles
-- (no requiere is_verified, solo status = 'approved' y is_active = true)
CREATE POLICY "Public can view active products from approved professionals"
ON public.digital_products
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    AND EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE professional_applications.id = digital_products.professional_id
        AND professional_applications.status = 'approved'
        AND professional_applications.is_active = true
    )
);

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Public can view active products from approved professionals" ON public.digital_products IS
'Permite que todos vean productos activos de profesionales aprobados y activos. No requiere verificación (is_verified), solo que el profesional esté aprobado y activo.';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que la política se creó correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using
FROM pg_policies
WHERE tablename = 'digital_products'
  AND policyname = 'Public can view active products from approved professionals';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
