-- ============================================================================
-- MIGRACIÓN 170: Actualizar Sistema de Puntos en Check-ins
-- ============================================================================
-- Descripción: Actualiza el sistema de puntos para check-ins según el tipo de evidencia
-- Nuevos valores:
--   - Texto: +1 punto
--   - Imagen: +2 puntos
--   - Audio: +2 puntos
--   - Sin evidencia (none): 0 puntos
-- Nota: Se mantiene el bonus por racha (streak) para fomentar la constancia
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
    streak_bonus INTEGER := 0;
BEGIN
    -- Puntos por tipo de evidencia (nuevos valores)
    CASE p_evidence_type
        WHEN 'text' THEN evidence_points := 1;
        WHEN 'photo' THEN evidence_points := 2;
        WHEN 'audio' THEN evidence_points := 2;
        WHEN 'video' THEN evidence_points := 2; -- Mantener video por si acaso
        WHEN 'none' THEN evidence_points := 0;
        ELSE evidence_points := 0;
    END CASE;
    
    -- Bonus por racha (streak) - se mantiene para fomentar constancia
    IF p_is_streak THEN
        -- Bonus progresivo: más días = más puntos
        IF p_streak_days >= 30 THEN
            streak_bonus := 50;
        ELSIF p_streak_days >= 14 THEN
            streak_bonus := 30;
        ELSIF p_streak_days >= 7 THEN
            streak_bonus := 20;
        ELSIF p_streak_days >= 3 THEN
            streak_bonus := 10;
        END IF;
    END IF;
    
    RETURN evidence_points + streak_bonus;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_checkin_points IS 'Calcula puntos ganados por un check-in: Texto (+1), Imagen (+2), Audio (+2), con bonus por racha';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
