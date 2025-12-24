-- =====================================================
-- MIGRACIÓN 20: Sistema de Estadísticas y Gamificación de Equipos
-- =====================================================
-- Descripción: Sistema completo de estadísticas, logros y gamificación para equipos
-- =====================================================

-- Tabla de estadísticas agregadas por equipo
CREATE TABLE IF NOT EXISTS public.team_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,

    -- Estadísticas generales
    total_checkins INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    current_team_streak INTEGER DEFAULT 0,
    longest_team_streak INTEGER DEFAULT 0,

    -- Progreso
    total_days_completed INTEGER DEFAULT 0,
    average_completion_rate DECIMAL(5,2) DEFAULT 0.0,

    -- Actividad
    active_members_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un solo registro de estadísticas por equipo
    CONSTRAINT unique_team_stats UNIQUE (team_id)
);

-- Tabla de logros/badges para equipos
CREATE TABLE IF NOT EXISTS public.team_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,

    -- Tipo de logro
    achievement_type TEXT NOT NULL CHECK (achievement_type IN (
        'first_checkin',          -- Primer check-in del equipo
        'team_streak_3',          -- Racha de 3 días consecutivos
        'team_streak_7',          -- Racha de 7 días consecutivos
        'team_streak_30',         -- Racha de 30 días consecutivos
        'all_members_active',     -- Todos los miembros activos en un día
        'challenge_completed',    -- Reto completado
        'total_points_100',       -- 100 puntos acumulados
        'total_points_500',       -- 500 puntos acumulados
        'total_points_1000',      -- 1000 puntos acumulados
        'perfect_week',           -- Semana perfecta (todos activos todos los días)
        'social_champions',       -- 50+ interacciones sociales
        'consistency_king'        -- 10+ días consecutivos con todos activos
    )),

    -- Metadata del logro
    title TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    points_awarded INTEGER DEFAULT 0,

    -- Timestamps
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un equipo solo puede ganar cada tipo de logro una vez
    CONSTRAINT unique_team_achievement UNIQUE (team_id, achievement_type)
);

-- Tabla de leaderboard global
CREATE TABLE IF NOT EXISTS public.team_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,

    -- Métricas de ranking
    rank INTEGER,
    total_points INTEGER DEFAULT 0,
    total_checkins INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    current_streak INTEGER DEFAULT 0,

    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un equipo solo aparece una vez por reto en el leaderboard
    CONSTRAINT unique_team_challenge_leaderboard UNIQUE (team_id, challenge_id)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_team_stats_team_id ON public.team_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_updated_at ON public.team_stats(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_achievements_team_id ON public.team_achievements(team_id);
CREATE INDEX IF NOT EXISTS idx_team_achievements_type ON public.team_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_team_achievements_earned_at ON public.team_achievements(earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_leaderboard_challenge_id ON public.team_leaderboard(challenge_id);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_rank ON public.team_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_points ON public.team_leaderboard(total_points DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_leaderboard ENABLE ROW LEVEL SECURITY;

-- Políticas para team_stats
DROP POLICY IF EXISTS "Las estadísticas de equipo son visibles para sus miembros" ON public.team_stats;
CREATE POLICY "Las estadísticas de equipo son visibles para sus miembros"
    ON public.team_stats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenge_team_members
            WHERE team_id = team_stats.team_id
            AND user_id = auth.uid()
        )
    );

-- Políticas para team_achievements
DROP POLICY IF EXISTS "Los logros de equipo son visibles para sus miembros" ON public.team_achievements;
CREATE POLICY "Los logros de equipo son visibles para sus miembros"
    ON public.team_achievements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenge_team_members
            WHERE team_id = team_achievements.team_id
            AND user_id = auth.uid()
        )
    );

-- Políticas para team_leaderboard
DROP POLICY IF EXISTS "El leaderboard es público" ON public.team_leaderboard;
CREATE POLICY "El leaderboard es público"
    ON public.team_leaderboard FOR SELECT
    USING (true);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar estadísticas del equipo cuando hay un check-in
CREATE OR REPLACE FUNCTION public.update_team_stats_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
    v_team_id UUID;
    v_points INTEGER;
    v_team_member_count INTEGER;
    v_active_today INTEGER;
BEGIN
    -- Obtener el team_id desde el challenge_purchase
    SELECT ct.id, cp.challenge_id INTO v_team_id
    FROM public.challenge_purchases cp
    JOIN public.challenge_teams ct ON ct.challenge_id = cp.challenge_id
    WHERE cp.id = NEW.challenge_purchase_id
    AND cp.team_id IS NOT NULL;

    -- Si no es un check-in de equipo, salir
    IF v_team_id IS NULL THEN
        RETURN NEW;
    END IF;

    v_points := COALESCE(NEW.points_earned, 0);

    -- Obtener número de miembros del equipo
    SELECT COUNT(*) INTO v_team_member_count
    FROM public.challenge_team_members
    WHERE team_id = v_team_id;

    -- Contar miembros activos hoy
    SELECT COUNT(DISTINCT cp.buyer_id) INTO v_active_today
    FROM public.challenge_checkins cc
    JOIN public.challenge_purchases cp ON cp.id = cc.challenge_purchase_id
    WHERE cp.team_id = v_team_id
    AND DATE(cc.checkin_date) = CURRENT_DATE;

    -- Actualizar o insertar estadísticas del equipo
    INSERT INTO public.team_stats (
        team_id,
        total_checkins,
        total_points,
        total_days_completed,
        active_members_count,
        last_activity_at,
        updated_at
    ) VALUES (
        v_team_id,
        1,
        v_points,
        1,
        v_active_today,
        NOW(),
        NOW()
    )
    ON CONFLICT (team_id) DO UPDATE SET
        total_checkins = team_stats.total_checkins + 1,
        total_points = team_stats.total_points + v_points,
        total_days_completed = team_stats.total_days_completed + 1,
        active_members_count = v_active_today,
        last_activity_at = NOW(),
        updated_at = NOW();

    -- Verificar logros automáticos
    -- Primer check-in
    IF NOT EXISTS (
        SELECT 1 FROM public.team_achievements
        WHERE team_id = v_team_id
        AND achievement_type = 'first_checkin'
    ) THEN
        INSERT INTO public.team_achievements (
            team_id, achievement_type, title, description, icon_name, points_awarded
        ) VALUES (
            v_team_id, 'first_checkin', '¡Primer Paso!',
            'El equipo completó su primer check-in', 'trophy', 10
        );
    END IF;

    -- Todos los miembros activos
    IF v_active_today = v_team_member_count AND v_team_member_count > 1 THEN
        -- Verificar si ya lo ganaron hoy
        IF NOT EXISTS (
            SELECT 1 FROM public.team_achievements
            WHERE team_id = v_team_id
            AND achievement_type = 'all_members_active'
            AND DATE(earned_at) = CURRENT_DATE
        ) THEN
            INSERT INTO public.team_achievements (
                team_id, achievement_type, title, description, icon_name, points_awarded
            ) VALUES (
                v_team_id, 'all_members_active', 'Equipo Completo',
                'Todos los miembros activos hoy', 'users', 50
            )
            ON CONFLICT (team_id, achievement_type) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar stats en cada check-in
DROP TRIGGER IF EXISTS trigger_update_team_stats_on_checkin ON public.challenge_checkins;
CREATE TRIGGER trigger_update_team_stats_on_checkin
    AFTER INSERT ON public.challenge_checkins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_stats_on_checkin();

-- Función para calcular y actualizar el leaderboard
CREATE OR REPLACE FUNCTION public.refresh_team_leaderboard(p_challenge_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Eliminar entradas antiguas para este reto
    DELETE FROM public.team_leaderboard
    WHERE challenge_id = p_challenge_id;

    -- Insertar nuevos rankings
    INSERT INTO public.team_leaderboard (
        team_id,
        challenge_id,
        rank,
        total_points,
        total_checkins,
        completion_percentage,
        current_streak,
        updated_at
    )
    SELECT
        ct.id,
        ct.challenge_id,
        ROW_NUMBER() OVER (ORDER BY ts.total_points DESC, ts.total_checkins DESC) as rank,
        COALESCE(ts.total_points, 0),
        COALESCE(ts.total_checkins, 0),
        COALESCE(ts.average_completion_rate, 0),
        COALESCE(ts.current_team_streak, 0),
        NOW()
    FROM public.challenge_teams ct
    LEFT JOIN public.team_stats ts ON ts.team_id = ct.id
    WHERE ct.challenge_id = p_challenge_id
    ORDER BY COALESCE(ts.total_points, 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de equipos con sus estadísticas completas
CREATE OR REPLACE VIEW public.team_dashboard AS
SELECT
    ct.id AS team_id,
    ct.team_name,
    ct.challenge_id,
    ct.creator_id,
    ct.max_members,
    ch.title AS challenge_title,

    -- Estadísticas
    COALESCE(ts.total_checkins, 0) AS total_checkins,
    COALESCE(ts.total_points, 0) AS total_points,
    COALESCE(ts.current_team_streak, 0) AS current_streak,
    COALESCE(ts.longest_team_streak, 0) AS longest_streak,
    COALESCE(ts.total_days_completed, 0) AS days_completed,
    COALESCE(ts.average_completion_rate, 0) AS completion_rate,
    COALESCE(ts.active_members_count, 0) AS active_members,
    ts.last_activity_at,

    -- Miembros
    (SELECT COUNT(*) FROM public.challenge_team_members WHERE team_id = ct.id) AS member_count,

    -- Logros
    (SELECT COUNT(*) FROM public.team_achievements WHERE team_id = ct.id) AS achievements_count,

    -- Ranking
    tl.rank AS leaderboard_rank,

    ct.created_at
FROM public.challenge_teams ct
LEFT JOIN public.challenges ch ON ch.id = ct.challenge_id
LEFT JOIN public.team_stats ts ON ts.team_id = ct.id
LEFT JOIN public.team_leaderboard tl ON tl.team_id = ct.id AND tl.challenge_id = ct.challenge_id;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.team_stats IS 'Estadísticas agregadas de equipos';
COMMENT ON TABLE public.team_achievements IS 'Logros y badges ganados por equipos';
COMMENT ON TABLE public.team_leaderboard IS 'Tabla de clasificación global de equipos por reto';
COMMENT ON VIEW public.team_dashboard IS 'Vista completa de equipos con estadísticas y ranking';
