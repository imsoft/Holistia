-- ============================================================================
-- MIGRACIÓN 218: Recalcular days_completed en challenge_progress
-- ============================================================================
-- Aplica la nueva lógica (COUNT DISTINCT day_number) a todos los registros
-- existentes de challenge_progress que puedan tener valores incorrectos
-- por la lógica anterior (+1 por cada check-in).
-- ============================================================================

-- Recalcular days_completed, completion_percentage, status y completed_at
-- basándose en días distintos con check-ins
UPDATE public.challenge_progress cp
SET
    days_completed = sub.distinct_days,
    completion_percentage = CASE 
        WHEN sub.duration_days > 0 THEN LEAST(100, (sub.distinct_days::DECIMAL / sub.duration_days * 100))
        ELSE 0 
    END,
    status = CASE 
        WHEN sub.duration_days > 0 AND sub.distinct_days >= sub.duration_days THEN 'completed'
        ELSE 'in_progress'
    END,
    completed_at = CASE 
        WHEN sub.duration_days > 0 AND sub.distinct_days >= sub.duration_days AND cp.completed_at IS NULL THEN NOW()
        WHEN sub.duration_days > 0 AND sub.distinct_days >= sub.duration_days THEN cp.completed_at
        ELSE NULL
    END,
    updated_at = NOW()
FROM (
    SELECT 
        cc.challenge_purchase_id,
        COUNT(DISTINCT cc.day_number)::INTEGER AS distinct_days,
        COALESCE(c.duration_days, 0)::INTEGER AS duration_days
    FROM public.challenge_checkins cc
    INNER JOIN public.challenge_purchases chp ON chp.id = cc.challenge_purchase_id
    INNER JOIN public.challenges c ON c.id = chp.challenge_id
    GROUP BY cc.challenge_purchase_id, c.duration_days
) sub
WHERE cp.challenge_purchase_id = sub.challenge_purchase_id
AND (
    -- Solo actualizar si days_completed no coincide con la cuenta real
    cp.days_completed != sub.distinct_days
    OR cp.completion_percentage != LEAST(100, (sub.distinct_days::DECIMAL / NULLIF(sub.duration_days, 0) * 100))
    OR (sub.duration_days > 0 AND sub.distinct_days >= sub.duration_days AND cp.status != 'completed')
    OR (sub.duration_days > 0 AND sub.distinct_days < sub.duration_days AND cp.status = 'completed')
);

-- Si algún reto pasó de "completed" a "in_progress", limpiar completed_at en challenge_purchases
UPDATE public.challenge_purchases cp
SET completed_at = NULL,
    updated_at = NOW()
WHERE cp.completed_at IS NOT NULL
AND EXISTS (
    SELECT 1 FROM public.challenge_progress pr
    WHERE pr.challenge_purchase_id = cp.id
    AND pr.status = 'in_progress'
);

-- Comentario para documentación
COMMENT ON TABLE public.challenge_progress IS 
    'Progreso por reto. days_completed = días distintos con al menos un check-in (migración 218).';
