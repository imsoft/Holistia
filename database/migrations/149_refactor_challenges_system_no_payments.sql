-- ============================================================================
-- MIGRACIÓN 149: Refactorizar sistema de retos - Sin pagos, con vinculación
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: 
--   - Eliminar sistema de pagos de retos
--   - Permitir que profesionales Y pacientes creen retos
--   - Agregar sistema de vinculación (profesional→paciente, paciente→profesional)
-- ============================================================================

-- ============================================================================
-- 1. ELIMINAR/ACTUALIZAR VISTAS QUE DEPENDEN DE CAMPOS DE PAGOS
-- ============================================================================

-- Eliminar la vista que depende de price antes de eliminar la columna
DROP VIEW IF EXISTS public.challenges_with_professional;

-- ============================================================================
-- 2. MODIFICAR TABLA CHALLENGES
-- ============================================================================

-- Eliminar campos relacionados con pagos
ALTER TABLE public.challenges
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS sales_count;

-- Hacer professional_id opcional (NULL permitido)
ALTER TABLE public.challenges
  ALTER COLUMN professional_id DROP NOT NULL;

-- Agregar campos para identificar quién creó el reto
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_type TEXT CHECK (created_by_type IN ('professional', 'patient')) NOT NULL DEFAULT 'professional';

-- Agregar campos para vinculación
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS linked_patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_professional_id UUID REFERENCES public.professional_applications(id) ON DELETE SET NULL;

-- Crear índices para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_challenges_created_by_user_id ON public.challenges(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_created_by_type ON public.challenges(created_by_type);
CREATE INDEX IF NOT EXISTS idx_challenges_linked_patient_id ON public.challenges(linked_patient_id);
CREATE INDEX IF NOT EXISTS idx_challenges_linked_professional_id ON public.challenges(linked_professional_id);

-- Comentarios
COMMENT ON COLUMN public.challenges.created_by_user_id IS 'ID del usuario (profesional o paciente) que creó el reto';
COMMENT ON COLUMN public.challenges.created_by_type IS 'Tipo de usuario que creó el reto: professional o patient';
COMMENT ON COLUMN public.challenges.linked_patient_id IS 'ID del paciente vinculado al reto (si fue creado por un profesional)';
COMMENT ON COLUMN public.challenges.linked_professional_id IS 'ID del profesional vinculado al reto (si fue creado por un paciente)';

-- ============================================================================
-- 3. MODIFICAR TABLA CHALLENGE_PURCHASES (ahora será challenge_participations)
-- ============================================================================

-- Renombrar tabla (opcional, pero mejor mantener nombre por compatibilidad)
-- ALTER TABLE public.challenge_purchases RENAME TO challenge_participations;

-- Primero eliminar políticas RLS que dependen de professional_id
DROP POLICY IF EXISTS "Professionals can view purchases of their challenges" ON public.challenge_purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.challenge_purchases;
DROP POLICY IF EXISTS "Users can create their own purchases" ON public.challenge_purchases;

-- Eliminar campos relacionados con pagos
ALTER TABLE public.challenge_purchases
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  DROP COLUMN IF EXISTS stripe_charge_id,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS professional_id;

-- Cambiar access_granted a true por defecto (ya no hay pagos)
ALTER TABLE public.challenge_purchases
  ALTER COLUMN access_granted SET DEFAULT true;

-- Actualizar todos los registros existentes para tener access_granted = true
UPDATE public.challenge_purchases
SET access_granted = true
WHERE access_granted = false;

-- Renombrar buyer_id a participant_id (más semántico)
ALTER TABLE public.challenge_purchases
  RENAME COLUMN buyer_id TO participant_id;

-- Actualizar índice
DROP INDEX IF EXISTS idx_challenge_purchases_buyer_id;
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_participant_id ON public.challenge_purchases(participant_id);

-- Eliminar índice de professional_id (ya no existe)
DROP INDEX IF EXISTS idx_challenge_purchases_professional_id;

-- Eliminar índice de payment_status (ya no existe)
DROP INDEX IF EXISTS idx_challenge_purchases_payment_status;

-- Actualizar constraint único
ALTER TABLE public.challenge_purchases
  DROP CONSTRAINT IF EXISTS challenge_purchases_unique;

ALTER TABLE public.challenge_purchases
  ADD CONSTRAINT challenge_purchases_unique UNIQUE (challenge_id, participant_id);

-- Comentarios
COMMENT ON TABLE public.challenge_purchases IS 'Participaciones/registros de usuarios en retos (ya no requiere pago)';
COMMENT ON COLUMN public.challenge_purchases.participant_id IS 'ID del usuario que participa en el reto';
COMMENT ON COLUMN public.challenge_purchases.access_granted IS 'Siempre true, ya que no hay pagos';

-- ============================================================================
-- 4. ACTUALIZAR POLÍTICAS RLS PARA CHALLENGES
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Professionals can create their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Professionals can view their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Professionals can update their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Professionals can delete their own challenges" ON public.challenges;

-- Política: Usuarios autenticados pueden crear retos
CREATE POLICY "Authenticated users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (
  -- Debe ser el usuario que crea el reto
  created_by_user_id = auth.uid()
  AND (
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

-- Política: Usuarios pueden ver sus propios retos o retos vinculados a ellos
CREATE POLICY "Users can view their own or linked challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (
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

-- Política: Usuarios pueden actualizar sus propios retos
CREATE POLICY "Users can update their own challenges"
ON public.challenges
FOR UPDATE
TO authenticated
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- Política: Usuarios pueden eliminar sus propios retos
CREATE POLICY "Users can delete their own challenges"
ON public.challenges
FOR DELETE
TO authenticated
USING (created_by_user_id = auth.uid());

-- ============================================================================
-- 5. ACTUALIZAR POLÍTICAS RLS PARA CHALLENGE_PURCHASES
-- ============================================================================

-- Nota: Las políticas ya fueron eliminadas en la sección 3 antes de eliminar la columna professional_id
-- Aquí solo las recreamos con la nueva lógica

-- Política: Usuarios pueden ver sus propias participaciones
CREATE POLICY "Users can view their own participations"
ON public.challenge_purchases
FOR SELECT
TO authenticated
USING (participant_id = auth.uid());

-- Política: Profesionales pueden ver participaciones de retos que crearon o están vinculados
CREATE POLICY "Professionals can view participations of their challenges"
ON public.challenge_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_purchases.challenge_id
    AND (
      c.created_by_user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = c.linked_professional_id
        AND user_id = auth.uid()
      )
    )
  )
);

-- Política: Usuarios pueden crear sus propias participaciones
CREATE POLICY "Users can create their own participations"
ON public.challenge_purchases
FOR INSERT
TO authenticated
WITH CHECK (participant_id = auth.uid());

-- ============================================================================
-- 6. ACTUALIZAR POLÍTICAS RLS PARA CHALLENGE_FILES
-- ============================================================================

-- Eliminar política existente
DROP POLICY IF EXISTS "Anyone can view challenge files for purchased challenges" ON public.challenge_files;

-- Nueva política: Usuarios pueden ver archivos de retos en los que participan
CREATE POLICY "Users can view challenge files for their participations"
ON public.challenge_files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenge_purchases
    WHERE challenge_purchases.challenge_id = challenge_files.challenge_id
    AND challenge_purchases.participant_id = auth.uid()
    AND challenge_purchases.access_granted = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.challenges
    WHERE challenges.id = challenge_files.challenge_id
    AND challenges.created_by_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.challenges c
    INNER JOIN public.professional_applications pa ON c.linked_professional_id = pa.id
    WHERE c.id = challenge_files.challenge_id
    AND pa.user_id = auth.uid()
  )
);

-- ============================================================================
-- 7. ACTUALIZAR FUNCIONES Y TRIGGERS
-- ============================================================================

-- Eliminar función de incrementar ventas (ya no se usa)
DROP FUNCTION IF EXISTS increment_challenge_sales(UUID);

-- ============================================================================
-- 8. RECREAR VISTA challenges_with_professional (SIN CAMPOS DE PAGOS)
-- ============================================================================

-- Recrear la vista sin los campos de pagos (price, currency, sales_count)
CREATE OR REPLACE VIEW public.challenges_with_professional AS
SELECT
    c.id,
    c.professional_id,
    c.created_by_user_id,
    c.created_by_type,
    c.linked_patient_id,
    c.linked_professional_id,
    c.title,
    c.description,
    c.short_description,
    c.cover_image_url,
    c.duration_days,
    c.difficulty_level,
    c.category,
    c.wellness_areas,
    c.is_active,
    c.created_at,
    c.updated_at,
    -- Información del profesional creador (si existe)
    pa.first_name as professional_first_name,
    pa.last_name as professional_last_name,
    pa.profile_photo as professional_photo,
    pa.profession as professional_profession,
    pa.is_verified as professional_is_verified,
    -- Información del profesional vinculado (si existe)
    linked_pa.first_name as linked_professional_first_name,
    linked_pa.last_name as linked_professional_last_name,
    linked_pa.profile_photo as linked_professional_photo,
    linked_pa.profession as linked_professional_profession,
    linked_pa.is_verified as linked_professional_is_verified
FROM public.challenges c
LEFT JOIN public.professional_applications pa ON c.professional_id = pa.id
LEFT JOIN public.professional_applications linked_pa ON c.linked_professional_id = linked_pa.id
WHERE c.is_active = true
AND (pa.status = 'approved' OR pa.id IS NULL)
AND (pa.is_active = true OR pa.id IS NULL);

COMMENT ON VIEW public.challenges_with_professional IS 'Vista de retos activos con información del profesional creador y vinculado (sin campos de pagos)';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 
-- CAMBIOS PRINCIPALES:
-- 1. Retos ya no tienen precio ni moneda
-- 2. Cualquier usuario autenticado puede crear retos
-- 3. Los retos pueden estar vinculados a pacientes o profesionales
-- 4. Las "compras" ahora son "participaciones" sin pago
-- 5. Todos los participantes tienen acceso automático (access_granted = true)
--
-- MIGRACIÓN DE DATOS:
-- - Los retos existentes mantendrán su professional_id
-- - Se debe actualizar created_by_user_id y created_by_type para retos existentes
-- - Las participaciones existentes tendrán access_granted = true automáticamente
--
