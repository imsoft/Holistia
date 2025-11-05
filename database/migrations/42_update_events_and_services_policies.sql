-- ============================================================================
-- MIGRACIÓN: Actualizar políticas RLS de eventos y función de servicios
-- ============================================================================
-- Esta migración combina:
-- - Actualizar políticas RLS de events_workshops para soportar owner-based access
-- - Crear función RPC para obtener servicios de profesionales aprobados
-- ============================================================================

-- ============================================================================
-- PARTE 1: ACTUALIZAR POLÍTICAS RLS DE EVENTOS
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events_workshops;
DROP POLICY IF EXISTS "Events can be created by admins" ON events_workshops;
DROP POLICY IF EXISTS "Events can be updated by admins" ON events_workshops;
DROP POLICY IF EXISTS "Events can be deleted by admins" ON events_workshops;

-- Habilitar RLS
ALTER TABLE events_workshops ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver eventos activos
CREATE POLICY "Anyone can view active events"
ON events_workshops
FOR SELECT
USING (is_active = true);

-- Política: Admins pueden ver todos los eventos
CREATE POLICY "Admins can view all events"
ON events_workshops
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Política: Dueños de eventos pueden ver sus eventos
CREATE POLICY "Event owners can view their events"
ON events_workshops
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Política: Admins pueden crear eventos
CREATE POLICY "Admins can create events"
ON events_workshops
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Política: Admins pueden actualizar todos los eventos
CREATE POLICY "Admins can update all events"
ON events_workshops
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Política: Dueños de eventos pueden actualizar su información de Stripe
CREATE POLICY "Event owners can update their Stripe info"
ON events_workshops
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Política: Admins pueden eliminar eventos
CREATE POLICY "Admins can delete events"
ON events_workshops
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Comentario para documentar las políticas
COMMENT ON TABLE events_workshops IS 'Events and workshops with owner-based access control. Admins can manage all events, owners can view and update their own events.';

-- ============================================================================
-- PARTE 2: FUNCIÓN RPC PARA SERVICIOS
-- ============================================================================

-- Crear función RPC para obtener servicios de profesionales aprobados
-- Esta función permite a los pacientes leer servicios sin problemas de RLS
CREATE OR REPLACE FUNCTION get_professional_services(prof_id UUID)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  modality TEXT,
  duration INTEGER,
  isactive BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  cost NUMERIC,
  program_duration JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el profesional esté aprobado
  IF NOT EXISTS (
    SELECT 1 
    FROM public.professional_applications 
    WHERE id = prof_id 
    AND status = 'approved'
  ) THEN
    RETURN;
  END IF;

  -- Retornar servicios activos del profesional
  RETURN QUERY
  SELECT 
    ps.id,
    ps.professional_id,
    ps.user_id,
    ps.name,
    ps.description,
    ps.type,
    ps.modality,
    ps.duration,
    ps.isactive,
    ps.created_at,
    ps.updated_at,
    ps.cost,
    ps.program_duration
  FROM public.professional_services ps
  WHERE ps.professional_id = prof_id
  AND ps.isactive = true
  ORDER BY ps.created_at ASC;
END;
$$;

-- Comentario: Esta función permite a los usuarios autenticados leer
-- los servicios de profesionales aprobados sin problemas de RLS.
-- Es una solución temporal hasta que se configuren las políticas RLS correctas.

