-- Migración para arreglar la política de UPDATE de admins
-- Problema: La política "Admins can update all applications" busca en auth.users.raw_user_meta_data
-- pero el sistema usa la tabla "profiles" para determinar el tipo de usuario
-- (como se ve en "Admins can delete all applications" que sí funciona)

-- SOLUCIÓN: Cambiar la política de UPDATE para que use la tabla profiles
-- igual que las otras políticas de admin

-- 1. Eliminar la política actual que no funciona
DROP POLICY IF EXISTS "Admins can update all applications" ON public.professional_applications;

-- 2. Crear nueva política que use la tabla profiles (igual que DELETE y VIEW)
CREATE POLICY "Admins can update all applications" ON public.professional_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
    )
  );

-- 3. Comentario para documentar
COMMENT ON POLICY "Admins can update all applications" ON public.professional_applications IS
'Permite a los administradores actualizar todas las aplicaciones profesionales (usa tabla profiles como las demás políticas admin)';

-- NOTA: Esta política ahora es consistente con:
-- - "Admins can delete all applications" (usa profiles)
-- - "Admins can view all applications" (usa profiles)
