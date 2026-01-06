-- ============================================================================
-- MIGRACIÓN 150: Permitir que administradores creen retos
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: 
--   - Permitir que administradores creen retos
--   - Actualizar constraint de created_by_type para incluir 'admin'
-- ============================================================================

-- Eliminar constraint existente
ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_created_by_type_check;

-- Agregar nuevo constraint que incluye 'admin'
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_created_by_type_check 
  CHECK (created_by_type IN ('professional', 'patient', 'admin'));

-- Actualizar comentario
COMMENT ON COLUMN public.challenges.created_by_type IS 'Tipo de usuario que creó el reto: professional, patient o admin';

-- ============================================================================
-- ACTUALIZAR POLÍTICAS RLS PARA PERMITIR ADMINS
-- ============================================================================

-- Actualizar política de creación para permitir admins
DROP POLICY IF EXISTS "Authenticated users can create challenges" ON public.challenges;

CREATE POLICY "Authenticated users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (
  -- Debe ser el usuario que crea el reto
  created_by_user_id = auth.uid()
  AND (
    -- Si es admin, puede crear sin restricciones
    (created_by_type = 'admin' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND type = 'admin'
      AND account_active = true
    ))
    OR
    -- Si es profesional, debe existir y estar aprobado
    (created_by_type = 'professional' AND EXISTS (
      SELECT 1 FROM public.professional_applications
      WHERE id = challenges.professional_id
      AND user_id = auth.uid()
      AND status = 'approved'
      AND is_active = true
    ))
    OR
    -- Si es paciente, no necesita professional_id
    (created_by_type = 'patient' AND professional_id IS NULL)
  )
);

-- Actualizar política de visualización para incluir admins
DROP POLICY IF EXISTS "Users can view their own or linked challenges" ON public.challenges;

CREATE POLICY "Users can view their own or linked challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (
  -- Admins pueden ver todos los retos
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND type = 'admin'
    AND account_active = true
  )
  OR
  -- Puede ver si lo creó
  created_by_user_id = auth.uid()
  OR
  -- Puede ver si está vinculado como paciente
  linked_patient_id = auth.uid()
  OR
  -- Puede ver si está vinculado como profesional
  EXISTS (
    SELECT 1 FROM public.professional_applications
    WHERE id = challenges.linked_professional_id
    AND user_id = auth.uid()
  )
  OR
  -- Profesionales pueden ver retos vinculados a sus pacientes
  EXISTS (
    SELECT 1 FROM public.professional_applications pa
    INNER JOIN public.profiles p ON pa.user_id = p.id
    WHERE pa.id = challenges.linked_professional_id
    AND pa.user_id = auth.uid()
    AND challenges.linked_patient_id IN (
      SELECT id FROM auth.users
      WHERE id IN (
        SELECT user_id FROM public.professional_patient_info
        WHERE professional_id = pa.id
      )
    )
  )
  OR
  -- Retos activos públicos (para explorar)
  is_active = true
);

-- Actualizar política de actualización para incluir admins
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.challenges;

CREATE POLICY "Users can update their own challenges"
ON public.challenges
FOR UPDATE
TO authenticated
USING (
  -- Admins pueden actualizar cualquier reto
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND type = 'admin'
    AND account_active = true
  )
  OR
  -- O si es el creador
  created_by_user_id = auth.uid()
)
WITH CHECK (
  -- Admins pueden actualizar cualquier reto
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND type = 'admin'
    AND account_active = true
  )
  OR
  -- O si es el creador
  created_by_user_id = auth.uid()
);

-- Actualizar política de eliminación para incluir admins
DROP POLICY IF EXISTS "Users can delete their own challenges" ON public.challenges;

CREATE POLICY "Users can delete their own challenges"
ON public.challenges
FOR DELETE
TO authenticated
USING (
  -- Admins pueden eliminar cualquier reto
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND type = 'admin'
    AND account_active = true
  )
  OR
  -- O si es el creador
  created_by_user_id = auth.uid()
);
