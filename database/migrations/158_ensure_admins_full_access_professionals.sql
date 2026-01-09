-- ============================================================================
-- MIGRACIÓN 158: Asegurar acceso completo de admins a professional_applications
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Garantizar que los admins puedan hacer INSERT, UPDATE, DELETE
--            y SELECT en professional_applications sin restricciones
-- ============================================================================

-- Eliminar políticas antiguas de admins que usan auth.users
DROP POLICY IF EXISTS "Admins can view all applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can manage all professional applications" ON public.professional_applications;

-- Política completa para admins: SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Admins can manage all professional applications"
ON public.professional_applications
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
WHERE tablename = 'professional_applications'
  AND policyname LIKE '%admin%'
ORDER BY policyname;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Admins can manage all professional applications" ON public.professional_applications IS
'Permite que administradores activos puedan crear, leer, actualizar y eliminar cualquier aplicación profesional sin restricciones';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Esta política permite que los admins:
-- - Ver todas las aplicaciones profesionales (SELECT)
-- - Crear nuevas aplicaciones profesionales (INSERT)
-- - Actualizar cualquier campo de cualquier profesional (UPDATE)
-- - Eliminar aplicaciones profesionales (DELETE)
-- ============================================================================
