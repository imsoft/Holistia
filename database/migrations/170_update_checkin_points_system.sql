-- ============================================================================
-- MIGRACIÓN 170: Actualizar Sistema de Puntos en Check-ins
-- ============================================================================
-- Descripción: Actualiza el sistema de puntos para check-ins según el tipo de evidencia
-- Nuevos valores:
--   - Texto: +1 punto
--   - Imagen: +2 puntos
--   - Audio: +2 puntos
--   - Sin evidencia (none): 0 puntos
-- Nota: Se eliminó el bonus por racha (streak) y los puntos base.
-- Los puntos ahora son directamente según el tipo de evidencia subida.
-- ============================================================================

-- ============================================================================
-- 1. ACTUALIZAR FUNCIÓN PARA CALCULAR PUNTOS POR CHECK-IN
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_checkin_points(
    p_evidence_type TEXT,
    p_is_streak BOOLEAN,
    p_streak_days INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    evidence_points INTEGER := 0;
BEGIN
    -- Puntos por tipo de evidencia (valores simplificados)
    CASE p_evidence_type
        WHEN 'text' THEN evidence_points := 1;
        WHEN 'photo' THEN evidence_points := 2;
        WHEN 'audio' THEN evidence_points := 2;
        WHEN 'video' THEN evidence_points := 2; -- Mantener video por si acaso (aunque ya no se usa)
        WHEN 'none' THEN evidence_points := 0;
        ELSE evidence_points := 0;
    END CASE;
    
    -- Nota: Se eliminó el bonus por racha (streak) para simplificar el sistema
    -- Los puntos ahora son directamente según el tipo de evidencia
    
    RETURN evidence_points;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_checkin_points IS 'Calcula puntos ganados por un check-in: Texto (+1), Imagen (+2), Audio (+2)';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
