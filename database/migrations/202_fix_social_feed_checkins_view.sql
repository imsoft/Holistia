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
-- ELIMINAR VISTA team_feed_checkins (ya no se usa equipos)
-- ============================================================================

DROP VIEW IF EXISTS public.team_feed_checkins CASCADE;
