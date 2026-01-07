-- ============================================================================
-- MIGRACIÓN 153: Corregir política RLS para creación de retos por profesionales
-- ============================================================================
-- Fecha: 2026-01-07
-- Propósito:
--   - Permitir que profesionales creen retos usando created_by_user_id y created_by_type
--   - El campo professional_id es opcional (legacy)
--   - Verificar que el usuario tiene una aplicación profesional aprobada
-- ============================================================================

-- Eliminar la política antigua
DROP POLICY IF EXISTS "Authenticated users can create challenges" ON public.challenges;

-- Crear nueva política mejorada
CREATE POLICY "Authenticated users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (
  -- Debe ser el usuario que crea el reto
  created_by_user_id = auth.uid()
  AND (
    -- Si es profesional, debe tener aplicación aprobada
    (created_by_type = 'professional' AND EXISTS (
      SELECT 1 FROM public.professional_applications
      WHERE user_id = auth.uid()
      AND status = 'approved'
      AND is_active = true
    ))
    OR
    -- Si es paciente, no requiere validación adicional
    (created_by_type = 'patient')
    OR
    -- Si es admin, verificar en profiles
    (created_by_type = 'admin' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND type = 'admin'
      AND account_active = true
    ))
  )
);

COMMENT ON POLICY "Authenticated users can create challenges" ON public.challenges IS
  'Permite a usuarios autenticados crear retos. Profesionales deben tener aplicación aprobada. Pacientes y admins no requieren validación adicional.';

-- ============================================================================
-- END OF MIGRATION 153
-- ============================================================================
