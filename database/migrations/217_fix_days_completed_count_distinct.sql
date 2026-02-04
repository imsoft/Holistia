-- ============================================================================
-- MIGRACIÓN 217: Corregir días completados - contar días distintos
-- ============================================================================
-- Antes: days_completed se incrementaba +1 por cada check-in (varios en el
--        mismo día sumaban varios días, permitiendo "completar" con check-ins
--        repetidos en un solo día).
-- Ahora: days_completed = COUNT(DISTINCT day_number) - días únicos con al
--        menos un check-in. Se siguen permitiendo varios check-ins por día.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_challenge_progress_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
    v_challenge_duration INTEGER;
    v_current_streak INTEGER;
    v_last_checkin_date DATE;
    v_is_consecutive BOOLEAN;
    v_points INTEGER;
    v_days_completed INTEGER;
BEGIN
    -- Obtener duración del reto
    SELECT duration_days INTO v_challenge_duration
    FROM public.challenges c
    INNER JOIN public.challenge_purchases cp ON c.id = cp.challenge_id
    WHERE cp.id = NEW.challenge_purchase_id;
    
    -- Obtener último check-in (excluyendo el actual para el cálculo de consecutividad)
    SELECT checkin_date, day_number INTO v_last_checkin_date, v_current_streak
    FROM public.challenge_checkins
    WHERE challenge_purchase_id = NEW.challenge_purchase_id
    AND id != NEW.id
    ORDER BY checkin_date DESC, day_number DESC
    LIMIT 1;
    
    -- Verificar si es consecutivo (día siguiente)
    IF v_last_checkin_date IS NULL THEN
        v_is_consecutive := true;
        v_current_streak := 1;
    ELSIF NEW.day_number = (SELECT COALESCE(MAX(day_number), 0) FROM public.challenge_checkins WHERE challenge_purchase_id = NEW.challenge_purchase_id AND id != NEW.id) + 1 THEN
        v_is_consecutive := true;
        v_current_streak := (SELECT COALESCE(current_streak, 0) FROM public.challenge_progress WHERE challenge_purchase_id = NEW.challenge_purchase_id) + 1;
    ELSE
        v_is_consecutive := false;
        v_current_streak := 1;
    END IF;
    
    -- Calcular puntos
    v_points := calculate_checkin_points(NEW.evidence_type, v_is_consecutive, v_current_streak);
    NEW.points_earned := v_points;
    
    -- Días completados = días distintos con al menos un check-in (permite varios check-ins por día)
    SELECT COUNT(DISTINCT day_number)::INTEGER INTO v_days_completed
    FROM public.challenge_checkins
    WHERE challenge_purchase_id = NEW.challenge_purchase_id;
    
    -- Actualizar o crear registro de progreso
    INSERT INTO public.challenge_progress (
        challenge_purchase_id,
        total_points,
        current_streak,
        longest_streak,
        days_completed,
        last_checkin_date,
        completion_percentage,
        level,
        status
    )
    VALUES (
        NEW.challenge_purchase_id,
        v_points,
        v_current_streak,
        GREATEST(v_current_streak, (SELECT COALESCE(longest_streak, 0) FROM public.challenge_progress WHERE challenge_purchase_id = NEW.challenge_purchase_id)),
        v_days_completed,
        NEW.checkin_date,
        CASE WHEN v_challenge_duration > 0 THEN LEAST(100, (v_days_completed::DECIMAL / v_challenge_duration * 100)) ELSE 0 END,
        calculate_level_from_points(v_points),
        CASE WHEN v_challenge_duration > 0 AND v_days_completed >= v_challenge_duration THEN 'completed' ELSE 'in_progress' END
    )
    ON CONFLICT (challenge_purchase_id) DO UPDATE
    SET
        total_points = challenge_progress.total_points + v_points,
        current_streak = v_current_streak,
        longest_streak = GREATEST(challenge_progress.longest_streak, v_current_streak),
        days_completed = v_days_completed,
        last_checkin_date = NEW.checkin_date,
        completion_percentage = CASE 
            WHEN v_challenge_duration > 0 THEN 
                LEAST(100, (v_days_completed::DECIMAL / v_challenge_duration * 100))
            ELSE 0 
        END,
        level = calculate_level_from_points(challenge_progress.total_points + v_points),
        status = CASE 
            WHEN v_challenge_duration > 0 AND v_days_completed >= v_challenge_duration THEN 'completed'
            ELSE 'in_progress'
        END,
        completed_at = CASE 
            WHEN v_challenge_duration > 0 AND v_days_completed >= v_challenge_duration THEN NOW()
            ELSE challenge_progress.completed_at
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_challenge_progress_on_checkin IS 
    'Actualiza challenge_progress al insertar check-in. days_completed = COUNT(DISTINCT day_number) para permitir varios check-ins por día.';
