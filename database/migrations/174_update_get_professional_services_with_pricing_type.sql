-- ============================================================================
-- MIGRACIÓN 174: Actualizar función get_professional_services para incluir pricing_type
-- ============================================================================
-- Descripción: Actualiza la función RPC para incluir el campo pricing_type
-- ============================================================================

DROP FUNCTION IF EXISTS get_professional_services(UUID);

CREATE OR REPLACE FUNCTION get_professional_services(p_professional_id UUID)
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
  pricing_type TEXT,
  program_duration JSONB,
  image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el profesional esté aprobado
  IF NOT EXISTS (
    SELECT 1
    FROM public.professional_applications pa
    WHERE pa.id = p_professional_id
    AND pa.status = 'approved'
  ) THEN
    RETURN;
  END IF;

  -- Retornar servicios activos del profesional (incluyendo pricing_type e image_url)
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
    ps.pricing_type,
    ps.program_duration,
    ps.image_url
  FROM public.professional_services ps
  WHERE ps.professional_id = p_professional_id
  AND ps.isactive = true
  ORDER BY ps.created_at ASC;
END;
$$;

-- Comentario
COMMENT ON FUNCTION get_professional_services(UUID) IS
'Obtiene servicios activos de un profesional aprobado, incluyendo pricing_type e image_url. Usa SECURITY DEFINER para evitar problemas de RLS.';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
