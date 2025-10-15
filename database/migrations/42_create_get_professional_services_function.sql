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
