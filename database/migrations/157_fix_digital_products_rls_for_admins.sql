-- ============================================================================
-- MIGRACIÓN 157: Corregir políticas RLS de digital_products para admins
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Permitir que admins puedan crear, editar y eliminar productos
--            digitales para cualquier profesional sin restricciones
-- ============================================================================

-- Eliminar política antigua de admins
DROP POLICY IF EXISTS "Admins can do everything on digital_products" ON public.digital_products;

-- Crear política completa para admins con USING y WITH CHECK
CREATE POLICY "Admins can do everything on digital_products"
ON public.digital_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'digital_products'
ORDER BY policyname;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Admins can do everything on digital_products" ON public.digital_products IS
'Permite que administradores activos puedan crear, editar y eliminar productos digitales para cualquier profesional sin restricciones';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Esta política permite que los admins:
-- - Crear productos digitales para cualquier profesional
-- - Editar productos digitales de cualquier profesional
-- - Eliminar productos digitales de cualquier profesional
-- - Ver todos los productos digitales
-- ============================================================================
