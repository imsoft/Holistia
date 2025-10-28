-- Función RPC para obtener bloqueos de disponibilidad de un profesional
-- Esta función tiene permisos de administrador y puede leer todos los bloqueos
-- sin restricciones de RLS

CREATE OR REPLACE FUNCTION get_professional_availability_blocks(p_professional_id UUID)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  block_type TEXT,
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar con permisos del creador de la función (administrador)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ab.id,
    ab.professional_id,
    ab.user_id,
    ab.title,
    ab.description,
    ab.block_type,
    ab.start_date,
    ab.end_date,
    ab.start_time,
    ab.end_time,
    ab.is_recurring,
    ab.created_at,
    ab.updated_at
  FROM public.availability_blocks ab
  WHERE ab.professional_id = p_professional_id
  ORDER BY ab.start_date, ab.start_time;
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_professional_availability_blocks(UUID) TO authenticated;

-- Comentario para documentar la función
COMMENT ON FUNCTION get_professional_availability_blocks(UUID) IS 
'Función para obtener todos los bloqueos de disponibilidad de un profesional específico. 
Ejecuta con permisos de administrador para evitar restricciones de RLS.';
