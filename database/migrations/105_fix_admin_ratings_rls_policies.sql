-- =====================================================
-- MIGRACIÓN 105: Actualizar políticas RLS de admin_ratings
-- =====================================================
-- Fecha: Diciembre 2024
-- Propósito: Actualizar políticas RLS para usar public.profiles.type
--            en lugar de auth.users.raw_user_meta_data->>'type'
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Admins can view all admin ratings" ON public.admin_ratings;
DROP POLICY IF EXISTS "Admins can create admin ratings" ON public.admin_ratings;
DROP POLICY IF EXISTS "Admins can update their own ratings" ON public.admin_ratings;
DROP POLICY IF EXISTS "Admins can delete their own ratings" ON public.admin_ratings;

-- Solo administradores pueden ver todas las calificaciones
CREATE POLICY "Admins can view all admin ratings"
  ON public.admin_ratings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  );

-- Solo administradores pueden crear calificaciones
CREATE POLICY "Admins can create admin ratings"
  ON public.admin_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
    AND auth.uid() = admin_id
  );

-- Solo administradores pueden actualizar calificaciones (solo las suyas)
CREATE POLICY "Admins can update their own ratings"
  ON public.admin_ratings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
    AND auth.uid() = admin_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
    AND auth.uid() = admin_id
  );

-- Solo administradores pueden eliminar calificaciones (solo las suyas)
CREATE POLICY "Admins can delete their own ratings"
  ON public.admin_ratings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
    AND auth.uid() = admin_id
  );

-- =====================================================
-- NOTAS:
-- =====================================================
-- - Actualizado para usar public.profiles.type en lugar de
--   auth.users.raw_user_meta_data->>'type'
-- - Se añadió verificación de account_active = true
-- - Las políticas de profesionales se mantienen sin cambios
-- =====================================================
