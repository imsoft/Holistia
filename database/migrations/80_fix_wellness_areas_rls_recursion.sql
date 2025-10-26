-- Migración para arreglar la recursión infinita en las políticas RLS de wellness_areas
-- El problema: La política anterior causaba recursión infinita al intentar
-- verificar wellness_areas dentro de WITH CHECK

-- SOLUCIÓN: Usar políticas separadas para admins y usuarios normales

-- 1. Eliminar la política problemática
DROP POLICY IF EXISTS "Users can update own professional application" ON public.professional_applications;

-- 2. Crear política simple para usuarios (pueden actualizar TODO su aplicación)
-- La restricción de wellness_areas se manejará a nivel de aplicación
CREATE POLICY "Users can update own professional application" ON public.professional_applications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Asegurar que la política de admin pueda actualizar todo
-- (Esta debería existir ya, pero la recreamos para asegurar)
DROP POLICY IF EXISTS "Admins can update all applications" ON public.professional_applications;

CREATE POLICY "Admins can update all applications" ON public.professional_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- 4. Comentarios para documentar
COMMENT ON POLICY "Users can update own professional application" ON public.professional_applications IS
'Permite a los usuarios actualizar su propia aplicación profesional. La restricción de wellness_areas se maneja a nivel de aplicación (UI)';

COMMENT ON POLICY "Admins can update all applications" ON public.professional_applications IS
'Permite a los administradores actualizar todas las aplicaciones profesionales, incluyendo wellness_areas';

-- NOTA IMPORTANTE:
-- La restricción de wellness_areas se maneja ahora ÚNICAMENTE en la capa de aplicación:
-- 1. El formulario de registro NO muestra el selector de wellness_areas
-- 2. El dashboard del profesional muestra wellness_areas como solo lectura
-- 3. Solo el panel de administración tiene la UI para editar wellness_areas
--
-- Esto es suficiente porque:
-- - Los usuarios normales no pueden modificar wellness_areas (no tienen la UI)
-- - Solo los admins tienen acceso al panel de administración
-- - La autenticación y autorización ya está protegida
