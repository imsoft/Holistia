-- Migración 202: Corregir vista social_feed_checkins para incluir todos los campos necesarios
-- Esta migración actualiza la vista para que coincida con los nombres de columnas esperados por el componente SocialFeedPost
-- y agrega campos faltantes como checkin_time, professional info, y progreso del reto

-- ============================================================================
-- ACTUALIZAR VISTA social_feed_checkins
-- ============================================================================

DROP VIEW IF EXISTS public.social_feed_checkins CASCADE;

CREATE VIEW public.social_feed_checkins AS
SELECT
    cc.id AS checkin_id,
    cc.challenge_purchase_id,
    cc.day_number,
    cc.checkin_date,
    cc.checkin_time, -- Campo necesario para mostrar "hace X tiempo"
    cc.evidence_type,
    cc.evidence_url,
    cc.notes,
    cc.points_earned,
    cc.is_public,
    cc.created_at,

    -- Usuario que hizo el check-in (con nombres correctos)
    p.id AS user_id,
    p.first_name AS user_first_name,
    p.last_name AS user_last_name,
    p.avatar_url AS user_photo_url,
    p.email AS user_email,
    p.type AS user_type,

    -- Información del reto (con nombres correctos)
    ch.id AS challenge_id,
    ch.title AS challenge_title,
    ch.cover_image_url AS challenge_cover_image, -- Nombre correcto
    ch.category AS challenge_category,
    ch.difficulty_level AS challenge_difficulty, -- Nombre correcto
    ch.duration_days AS challenge_duration_days, -- Duración total del reto

    -- Información del profesional que creó el reto
    pa.id AS professional_id,
    pa.first_name AS professional_first_name,
    pa.last_name AS professional_last_name,
    pa.profile_photo AS professional_photo,

    -- Progreso del usuario en el reto
    pr.current_streak,
    pr.days_completed,
    pr.completion_percentage,

    -- Likes (legacy - mantener compatibilidad)
    COALESCE(like_count.count, 0) AS likes_count, -- Nombre correcto

    -- Reacciones por tipo
    (
        SELECT jsonb_object_agg(reaction_type, count)
        FROM (
            SELECT reaction_type, COUNT(*)::int AS count
            FROM public.post_reactions
            WHERE checkin_id = cc.id
            GROUP BY reaction_type
        ) reactions
    ) AS reactions,

    -- Total de reacciones
    COALESCE(total_reactions.count, 0) AS total_reactions,

    -- Comentarios (con nombre correcto)
    COALESCE(comment_count.count, 0) AS comments_count -- Nombre correcto

FROM public.challenge_checkins cc
JOIN public.challenge_purchases cp ON cp.id = cc.challenge_purchase_id
JOIN public.profiles p ON p.id = cp.participant_id
JOIN public.challenges ch ON ch.id = cp.challenge_id
LEFT JOIN public.professional_applications pa ON ch.professional_id = pa.id
LEFT JOIN public.challenge_progress pr ON cp.id = pr.challenge_purchase_id
LEFT JOIN (
    SELECT checkin_id, COUNT(*)::bigint AS count
    FROM public.challenge_checkin_likes
    GROUP BY checkin_id
) like_count ON like_count.checkin_id = cc.id
LEFT JOIN (
    SELECT checkin_id, COUNT(*)::bigint AS count
    FROM public.post_reactions
    GROUP BY checkin_id
) total_reactions ON total_reactions.checkin_id = cc.id
LEFT JOIN (
    SELECT checkin_id, COUNT(*)::bigint AS count
    FROM public.challenge_checkin_comments
    GROUP BY checkin_id
) comment_count ON comment_count.checkin_id = cc.id
WHERE cc.is_public = true
  AND cc.evidence_url IS NOT NULL
  AND ch.is_active = true
  AND (pa.status = 'approved' OR pa.id IS NULL)
  AND (pa.is_active = true OR pa.id IS NULL)
ORDER BY cc.checkin_time DESC NULLS LAST, cc.created_at DESC;

COMMENT ON VIEW public.social_feed_checkins IS 'Vista del feed social con todos los campos necesarios para mostrar posts, incluyendo información del usuario, reto, profesional y progreso';

-- ============================================================================
-- ACTUALIZAR VISTA team_feed_checkins (también usa buyer_id que fue renombrado)
-- ============================================================================

DROP VIEW IF EXISTS public.team_feed_checkins CASCADE;

CREATE OR REPLACE VIEW public.team_feed_checkins AS
SELECT
    cc.id as checkin_id,
    cc.challenge_purchase_id,
    cc.day_number,
    cc.checkin_date,
    cc.checkin_time,
    cc.evidence_type,
    cc.evidence_url,
    cc.notes,
    cc.points_earned,
    cc.is_public,
    cc.likes_count,
    cc.comments_count,
    -- Información del usuario que hizo el check-in
    cp.participant_id as user_id,
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.avatar_url as user_photo_url,
    p.email as user_email,
    p.type as user_type,
    -- Información del equipo
    ct.id as team_id,
    ct.team_name,
    ct.max_members,
    -- Información del reto
    c.id as challenge_id,
    c.title as challenge_title,
    c.cover_image_url as challenge_cover_image,
    c.category as challenge_category,
    c.difficulty_level as challenge_difficulty,
    c.duration_days as challenge_duration_days,
    -- Información del profesional
    pa.id as professional_id,
    pa.first_name as professional_first_name,
    pa.last_name as professional_last_name,
    pa.profile_photo as professional_photo,
    -- Progreso
    pr.current_streak,
    pr.days_completed,
    pr.completion_percentage
FROM public.challenge_checkins cc
INNER JOIN public.challenge_purchases cp ON cc.challenge_purchase_id = cp.id
INNER JOIN public.challenge_teams ct ON cp.team_id = ct.id
INNER JOIN public.challenges c ON cp.challenge_id = c.id
INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
INNER JOIN public.profiles p ON cp.participant_id = p.id
LEFT JOIN public.challenge_progress pr ON cp.id = pr.challenge_purchase_id
WHERE cc.is_public = true
  AND cp.is_team_challenge = true
  AND c.is_active = true
  AND pa.status = 'approved'
  AND pa.is_active = true;

COMMENT ON VIEW public.team_feed_checkins IS 'Vista de check-ins de equipos para el feed social';
