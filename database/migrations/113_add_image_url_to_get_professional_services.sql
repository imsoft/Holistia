-- ============================================================================
-- ACTUALIZAR FUNCIÓN get_professional_services PARA INCLUIR image_url
-- ============================================================================
-- Fecha: Noviembre 2025
-- Propósito: Incluir image_url en el retorno de la función RPC
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

  -- Retornar servicios activos del profesional (incluyendo image_url)
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
'Obtiene servicios activos de un profesional aprobado, incluyendo image_url. Usa SECURITY DEFINER para evitar problemas de RLS.';

