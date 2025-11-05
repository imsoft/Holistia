-- ============================================================================
-- MIGRACIÓN: Agregar owner a eventos y políticas de servicios
-- ============================================================================
-- Esta migración combina:
-- - Agregar campos owner a events_workshops
-- - Política RLS para que pacientes lean servicios aprobados
-- ============================================================================

-- ============================================================================
-- PARTE 1: AGREGAR OWNER A EVENTOS
-- ============================================================================

-- Agregar campos owner a events_workshops table
-- Esto permite que eventos sean propiedad de admins, profesionales o usuarios regulares
ALTER TABLE events_workshops
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS owner_type TEXT CHECK (owner_type IN ('admin', 'professional', 'patient'));

-- Crear índice para mejor rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_events_workshops_owner ON events_workshops(owner_id, owner_type);

-- Actualizar eventos existentes para tener un owner (usar professional_id si existe, sino created_by)
UPDATE events_workshops
SET
  owner_id = COALESCE(
    (SELECT user_id FROM professional_applications WHERE id = professional_id),
    created_by
  ),
  owner_type = CASE
    WHEN professional_id IS NOT NULL THEN 'professional'
    ELSE (
      SELECT
        CASE
          WHEN (raw_user_meta_data->>'type')::text = 'admin' THEN 'admin'
          ELSE 'patient'
        END
      FROM auth.users
      WHERE id = created_by
    )
  END
WHERE owner_id IS NULL;

-- Hacer campos owner requeridos después de la migración
ALTER TABLE events_workshops
ALTER COLUMN owner_id SET NOT NULL,
ALTER COLUMN owner_type SET NOT NULL;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN events_workshops.owner_id IS 'The user who owns this event and will receive payments';
COMMENT ON COLUMN events_workshops.owner_type IS 'Type of owner: admin, professional, or patient';

-- ============================================================================
-- PARTE 2: POLÍTICA RLS PARA SERVICIOS
-- ============================================================================

-- Permitir que usuarios autenticados lean servicios de profesionales aprobados
-- Esta política permite que los pacientes puedan ver los servicios de profesionales aprobados
CREATE POLICY IF NOT EXISTS "Patients can read approved professional services" ON public.professional_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.professional_applications pa 
    WHERE pa.id = professional_services.professional_id 
    AND pa.status = 'approved'
  )
);

-- Comentario: Esta política es necesaria para que los pacientes puedan ver
-- los servicios disponibles de los profesionales en la página de perfil
-- y en el diálogo de reservas de citas.

