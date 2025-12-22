-- Migración 145: Sistema de gamificación para retos
-- Combina check-ins diarios con sistema de puntos y badges
-- Los usuarios ganan puntos por check-ins y desbloquean badges por logros

-- ============================================================================
-- 1. TABLA DE CHECK-INS DIARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_purchase_id UUID NOT NULL REFERENCES public.challenge_purchases(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL, -- Día del reto (1, 2, 3, etc.)
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    evidence_type TEXT CHECK (evidence_type IN ('text', 'photo', 'video', 'audio', 'none')),
    evidence_url TEXT, -- URL del archivo multimedia si aplica
    notes TEXT, -- Texto del check-in
    points_earned INTEGER DEFAULT 0 NOT NULL, -- Puntos ganados por este check-in
    verified_by_professional BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Un usuario solo puede hacer un check-in por día del reto
    CONSTRAINT challenge_checkins_unique_day UNIQUE (challenge_purchase_id, day_number)
);

-- Habilitar RLS
ALTER TABLE public.challenge_checkins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. TABLA DE PROGRESO Y PUNTOS DEL USUARIO EN EL RETO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_purchase_id UUID NOT NULL REFERENCES public.challenge_purchases(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL, -- Racha de días consecutivos
    longest_streak INTEGER DEFAULT 0 NOT NULL, -- Racha más larga alcanzada
    days_completed INTEGER DEFAULT 0 NOT NULL, -- Total de días completados
    last_checkin_date DATE,
    completion_percentage DECIMAL(5, 2) DEFAULT 0 NOT NULL, -- Porcentaje de completitud
    level INTEGER DEFAULT 1 NOT NULL, -- Nivel basado en puntos
    status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Un registro de progreso por compra de reto
    CONSTRAINT challenge_progress_unique UNIQUE (challenge_purchase_id)
);

-- Habilitar RLS
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. TABLA DE BADGES/INSIGNIAS DISPONIBLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE, -- NULL = badge global (para todos los retos)
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT, -- Nombre del icono o emoji
    badge_color TEXT, -- Color del badge
    badge_type TEXT NOT NULL CHECK (badge_type IN ('streak', 'completion', 'points', 'special', 'milestone')),
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('days_streak', 'total_days', 'total_points', 'level', 'custom')),
    requirement_value INTEGER, -- Valor requerido (ej: 7 días, 100 puntos)
    points_reward INTEGER DEFAULT 0, -- Puntos adicionales al desbloquear
    is_active BOOLEAN DEFAULT true NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.challenge_badges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. TABLA DE BADGES DESBLOQUEADOS POR USUARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_purchase_id UUID NOT NULL REFERENCES public.challenge_purchases(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.challenge_badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    points_earned INTEGER DEFAULT 0, -- Puntos ganados al desbloquear este badge
    
    -- Un usuario solo puede tener un badge una vez
    CONSTRAINT challenge_user_badges_unique UNIQUE (challenge_purchase_id, badge_id)
);

-- Habilitar RLS
ALTER TABLE public.challenge_user_badges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. POLÍTICAS RLS PARA CHALLENGE_CHECKINS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own checkins" ON public.challenge_checkins;
DROP POLICY IF EXISTS "Users can create their own checkins" ON public.challenge_checkins;
DROP POLICY IF EXISTS "Professionals can view checkins of their challenges" ON public.challenge_checkins;
DROP POLICY IF EXISTS "Professionals can verify checkins" ON public.challenge_checkins;

-- Los usuarios pueden ver sus propios check-ins
CREATE POLICY "Users can view their own checkins"
ON public.challenge_checkins
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_checkins.challenge_purchase_id
        AND challenge_purchases.buyer_id = auth.uid()
    )
);

-- Los usuarios pueden crear sus propios check-ins
CREATE POLICY "Users can create their own checkins"
ON public.challenge_checkins
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_checkins.challenge_purchase_id
        AND challenge_purchases.buyer_id = auth.uid()
        AND challenge_purchases.access_granted = true
    )
);

-- Los profesionales pueden ver check-ins de sus retos
CREATE POLICY "Professionals can view checkins of their challenges"
ON public.challenge_checkins
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON cp.challenge_id = c.id
        INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
        WHERE cp.id = challenge_checkins.challenge_purchase_id
        AND pa.user_id = auth.uid()
    )
);

-- Los profesionales pueden verificar check-ins
CREATE POLICY "Professionals can verify checkins"
ON public.challenge_checkins
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON cp.challenge_id = c.id
        INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
        WHERE cp.id = challenge_checkins.challenge_purchase_id
        AND pa.user_id = auth.uid()
    )
);

-- ============================================================================
-- 6. POLÍTICAS RLS PARA CHALLENGE_PROGRESS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Professionals can view progress of their challenges" ON public.challenge_progress;

-- Los usuarios pueden ver su propio progreso
CREATE POLICY "Users can view their own progress"
ON public.challenge_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_progress.challenge_purchase_id
        AND challenge_purchases.buyer_id = auth.uid()
    )
);

-- Los profesionales pueden ver progreso de sus retos
CREATE POLICY "Professionals can view progress of their challenges"
ON public.challenge_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON cp.challenge_id = c.id
        INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
        WHERE cp.id = challenge_progress.challenge_purchase_id
        AND pa.user_id = auth.uid()
    )
);

-- ============================================================================
-- 7. POLÍTICAS RLS PARA CHALLENGE_BADGES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active badges" ON public.challenge_badges;

-- Todos pueden ver badges activos
CREATE POLICY "Anyone can view active badges"
ON public.challenge_badges
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- ============================================================================
-- 8. POLÍTICAS RLS PARA CHALLENGE_USER_BADGES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own badges" ON public.challenge_user_badges;
DROP POLICY IF EXISTS "Professionals can view badges of their challenge participants" ON public.challenge_user_badges;

-- Los usuarios pueden ver sus propios badges
CREATE POLICY "Users can view their own badges"
ON public.challenge_user_badges
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_purchases.id = challenge_user_badges.challenge_purchase_id
        AND challenge_purchases.buyer_id = auth.uid()
    )
);

-- Los profesionales pueden ver badges de participantes
CREATE POLICY "Professionals can view badges of their challenge participants"
ON public.challenge_user_badges
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenge_purchases cp
        INNER JOIN public.challenges c ON cp.challenge_id = c.id
        INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
        WHERE cp.id = challenge_user_badges.challenge_purchase_id
        AND pa.user_id = auth.uid()
    )
);

-- ============================================================================
-- 9. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_challenge_checkins_purchase_id ON public.challenge_checkins(challenge_purchase_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_date ON public.challenge_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_purchase_id ON public.challenge_progress(challenge_purchase_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_status ON public.challenge_progress(status);
CREATE INDEX IF NOT EXISTS idx_challenge_badges_challenge_id ON public.challenge_badges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_badges_type ON public.challenge_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_challenge_user_badges_purchase_id ON public.challenge_user_badges(challenge_purchase_id);
CREATE INDEX IF NOT EXISTS idx_challenge_user_badges_badge_id ON public.challenge_user_badges(badge_id);

-- ============================================================================
-- 10. FUNCIÓN PARA CALCULAR PUNTOS POR CHECK-IN
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_checkin_points(
    p_evidence_type TEXT,
    p_is_streak BOOLEAN,
    p_streak_days INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    base_points INTEGER := 10; -- Puntos base por check-in
    evidence_bonus INTEGER := 0;
    streak_bonus INTEGER := 0;
BEGIN
    -- Bonus por tipo de evidencia
    CASE p_evidence_type
        WHEN 'text' THEN evidence_bonus := 5;
        WHEN 'photo' THEN evidence_bonus := 10;
        WHEN 'video' THEN evidence_bonus := 15;
        WHEN 'audio' THEN evidence_bonus := 10;
        ELSE evidence_bonus := 0;
    END CASE;
    
    -- Bonus por racha (streak)
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
    
    RETURN base_points + evidence_bonus + streak_bonus;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_checkin_points IS 'Calcula puntos ganados por un check-in basado en evidencia y racha';

-- ============================================================================
-- 11. FUNCIÓN PARA CALCULAR NIVEL BASADO EN PUNTOS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_level_from_points(p_total_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Sistema de niveles: cada 100 puntos = 1 nivel
    -- Nivel 1: 0-99 puntos
    -- Nivel 2: 100-199 puntos
    -- Nivel 3: 200-299 puntos
    -- etc.
    RETURN GREATEST(1, FLOOR(p_total_points / 100) + 1);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_level_from_points IS 'Calcula el nivel del usuario basado en puntos totales';

-- ============================================================================
-- 12. FUNCIÓN PARA VERIFICAR Y DESBLOQUEAR BADGES
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_unlock_badges(p_challenge_purchase_id UUID)
RETURNS TABLE(unlocked_badge_id UUID, badge_name TEXT, points_earned INTEGER) AS $$
DECLARE
    v_progress RECORD;
    v_badge RECORD;
    v_already_unlocked BOOLEAN;
    v_meets_requirement BOOLEAN;
BEGIN
    -- Obtener progreso del usuario
    SELECT * INTO v_progress
    FROM public.challenge_progress
    WHERE challenge_purchase_id = p_challenge_purchase_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Obtener challenge_id
    DECLARE
        v_challenge_id UUID;
    BEGIN
        SELECT challenge_id INTO v_challenge_id
        FROM public.challenge_purchases
        WHERE id = p_challenge_purchase_id;
        
        -- Buscar badges que el usuario aún no tiene
        FOR v_badge IN
            SELECT * FROM public.challenge_badges
            WHERE (challenge_id = v_challenge_id OR challenge_id IS NULL)
            AND is_active = true
            AND id NOT IN (
                SELECT badge_id FROM public.challenge_user_badges
                WHERE challenge_purchase_id = p_challenge_purchase_id
            )
        LOOP
            -- Verificar si cumple el requisito
            v_meets_requirement := false;
            
            CASE v_badge.requirement_type
                WHEN 'days_streak' THEN
                    v_meets_requirement := v_progress.current_streak >= v_badge.requirement_value;
                WHEN 'total_days' THEN
                    v_meets_requirement := v_progress.days_completed >= v_badge.requirement_value;
                WHEN 'total_points' THEN
                    v_meets_requirement := v_progress.total_points >= v_badge.requirement_value;
                WHEN 'level' THEN
                    v_meets_requirement := v_progress.level >= v_badge.requirement_value;
                ELSE
                    v_meets_requirement := false;
            END CASE;
            
            -- Si cumple el requisito, desbloquear badge
            IF v_meets_requirement THEN
                -- Verificar si ya está desbloqueado
                SELECT EXISTS (
                    SELECT 1 FROM public.challenge_user_badges
                    WHERE challenge_purchase_id = p_challenge_purchase_id
                    AND badge_id = v_badge.id
                ) INTO v_already_unlocked;
                
                IF NOT v_already_unlocked THEN
                    INSERT INTO public.challenge_user_badges (
                        challenge_purchase_id,
                        badge_id,
                        points_earned
                    ) VALUES (
                        p_challenge_purchase_id,
                        v_badge.id,
                        v_badge.points_reward
                    );
                    
                    -- Actualizar puntos totales
                    UPDATE public.challenge_progress
                    SET total_points = total_points + v_badge.points_reward
                    WHERE challenge_purchase_id = p_challenge_purchase_id;
                    
                    -- Retornar badge desbloqueado
                    unlocked_badge_id := v_badge.id;
                    badge_name := v_badge.badge_name;
                    points_earned := v_badge.points_reward;
                    RETURN NEXT;
                END IF;
            END IF;
        END LOOP;
    END;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_and_unlock_badges IS 'Verifica y desbloquea badges cuando el usuario cumple requisitos';

-- ============================================================================
-- 13. TRIGGER PARA ACTUALIZAR PROGRESO AL CREAR CHECK-IN
-- ============================================================================

CREATE OR REPLACE FUNCTION update_challenge_progress_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
    v_challenge_duration INTEGER;
    v_current_streak INTEGER;
    v_last_checkin_date DATE;
    v_is_consecutive BOOLEAN;
    v_points INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Obtener duración del reto
    SELECT duration_days INTO v_challenge_duration
    FROM public.challenges c
    INNER JOIN public.challenge_purchases cp ON c.id = cp.challenge_id
    WHERE cp.id = NEW.challenge_purchase_id;
    
    -- Obtener último check-in
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
        1,
        NEW.checkin_date,
        CASE WHEN v_challenge_duration > 0 THEN (1.0 / v_challenge_duration * 100) ELSE 0 END,
        calculate_level_from_points(v_points),
        'in_progress'
    )
    ON CONFLICT (challenge_purchase_id) DO UPDATE
    SET
        total_points = challenge_progress.total_points + v_points,
        current_streak = v_current_streak,
        longest_streak = GREATEST(challenge_progress.longest_streak, v_current_streak),
        days_completed = challenge_progress.days_completed + 1,
        last_checkin_date = NEW.checkin_date,
        completion_percentage = CASE 
            WHEN v_challenge_duration > 0 THEN 
                LEAST(100, ((challenge_progress.days_completed + 1)::DECIMAL / v_challenge_duration * 100))
            ELSE 0 
        END,
        level = calculate_level_from_points(challenge_progress.total_points + v_points),
        status = CASE 
            WHEN v_challenge_duration > 0 AND (challenge_progress.days_completed + 1) >= v_challenge_duration THEN 'completed'
            ELSE 'in_progress'
        END,
        completed_at = CASE 
            WHEN v_challenge_duration > 0 AND (challenge_progress.days_completed + 1) >= v_challenge_duration THEN NOW()
            ELSE challenge_progress.completed_at
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress_on_checkin
AFTER INSERT ON public.challenge_checkins
FOR EACH ROW
EXECUTE FUNCTION update_challenge_progress_on_checkin();

-- ============================================================================
-- 14. TRIGGER PARA VERIFICAR BADGES DESPUÉS DE ACTUALIZAR PROGRESO
-- ============================================================================

CREATE OR REPLACE FUNCTION check_badges_after_progress_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar y desbloquear badges automáticamente
    PERFORM check_and_unlock_badges(NEW.challenge_purchase_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_badges_after_progress
AFTER INSERT OR UPDATE ON public.challenge_progress
FOR EACH ROW
EXECUTE FUNCTION check_badges_after_progress_update();

-- ============================================================================
-- 15. INSERTAR BADGES PREDEFINIDOS (GLOBALES)
-- ============================================================================

-- Badges de racha (streak)
INSERT INTO public.challenge_badges (badge_name, badge_description, badge_icon, badge_color, badge_type, requirement_type, requirement_value, points_reward, display_order) VALUES
('🔥 Primera Racha', 'Completa 3 días consecutivos', '🔥', '#FF6B35', 'streak', 'days_streak', 3, 20, 1),
('⚡ Racha Semanal', 'Completa 7 días consecutivos', '⚡', '#4ECDC4', 'streak', 'days_streak', 7, 50, 2),
('💪 Racha Quincenal', 'Completa 14 días consecutivos', '💪', '#45B7D1', 'streak', 'days_streak', 14, 100, 3),
('🏆 Racha Mensual', 'Completa 30 días consecutivos', '🏆', '#FFA07A', 'streak', 'days_streak', 30, 200, 4),
('👑 Leyenda', 'Completa 60 días consecutivos', '👑', '#FFD700', 'streak', 'days_streak', 60, 500, 5)
ON CONFLICT DO NOTHING;

-- Badges de completitud
INSERT INTO public.challenge_badges (badge_name, badge_description, badge_icon, badge_color, badge_type, requirement_type, requirement_value, points_reward, display_order) VALUES
('🎯 Primer Paso', 'Completa tu primer día', '🎯', '#95E1D3', 'completion', 'total_days', 1, 10, 10),
('📅 Semana Completa', 'Completa 7 días del reto', '📅', '#F38181', 'completion', 'total_days', 7, 50, 11),
('📆 Medio Reto', 'Completa la mitad del reto', '📆', '#AA96DA', 'completion', 'total_days', 15, 100, 12),
('✅ Reto Completado', 'Completa todo el reto', '✅', '#FCBAD3', 'completion', 'total_days', 30, 300, 13)
ON CONFLICT DO NOTHING;

-- Badges de puntos
INSERT INTO public.challenge_badges (badge_name, badge_description, badge_icon, badge_color, badge_type, requirement_type, requirement_value, points_reward, display_order) VALUES
('⭐ Novato', 'Alcanza 50 puntos', '⭐', '#FFD93D', 'points', 'total_points', 50, 25, 20),
('🌟 Aprendiz', 'Alcanza 100 puntos', '🌟', '#6BCB77', 'points', 'total_points', 100, 50, 21),
('✨ Experto', 'Alcanza 250 puntos', '✨', '#4D96FF', 'points', 'total_points', 250, 100, 22),
('💫 Maestro', 'Alcanza 500 puntos', '💫', '#9B59B6', 'points', 'total_points', 500, 200, 23),
('🚀 Leyenda', 'Alcanza 1000 puntos', '🚀', '#E74C3C', 'points', 'total_points', 1000, 500, 24)
ON CONFLICT DO NOTHING;

-- Badges de nivel
INSERT INTO public.challenge_badges (badge_name, badge_description, badge_icon, badge_color, badge_type, requirement_type, requirement_value, points_reward, display_order) VALUES
('🥉 Nivel 5', 'Alcanza el nivel 5', '🥉', '#CD7F32', 'milestone', 'level', 5, 50, 30),
('🥈 Nivel 10', 'Alcanza el nivel 10', '🥈', '#C0C0C0', 'milestone', 'level', 10, 100, 31),
('🥇 Nivel 20', 'Alcanza el nivel 20', '🥇', '#FFD700', 'milestone', 'level', 20, 250, 32)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.challenge_checkins IS 'Check-ins diarios de usuarios en retos';
COMMENT ON COLUMN public.challenge_checkins.day_number IS 'Número de día del reto (1, 2, 3, etc.)';
COMMENT ON COLUMN public.challenge_checkins.evidence_type IS 'Tipo de evidencia: text, photo, video, audio, none';
COMMENT ON COLUMN public.challenge_checkins.points_earned IS 'Puntos ganados por este check-in específico';

COMMENT ON TABLE public.challenge_progress IS 'Progreso y estadísticas del usuario en un reto';
COMMENT ON COLUMN public.challenge_progress.current_streak IS 'Racha actual de días consecutivos';
COMMENT ON COLUMN public.challenge_progress.longest_streak IS 'Racha más larga alcanzada';
COMMENT ON COLUMN public.challenge_progress.level IS 'Nivel del usuario basado en puntos totales';

COMMENT ON TABLE public.challenge_badges IS 'Badges/insignias disponibles para desbloquear';
COMMENT ON COLUMN public.challenge_badges.challenge_id IS 'NULL = badge global para todos los retos';
COMMENT ON COLUMN public.challenge_badges.badge_type IS 'Tipo: streak, completion, points, special, milestone';
COMMENT ON COLUMN public.challenge_badges.requirement_type IS 'Tipo de requisito: days_streak, total_days, total_points, level, custom';

COMMENT ON TABLE public.challenge_user_badges IS 'Badges desbloqueados por usuarios';
