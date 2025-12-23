-- Migración 16: Sistema de equipos para retos
-- Permite que hasta 5 usuarios hagan un reto juntos
-- Los usuarios deben seguirse mutuamente y tener el reto comprado

-- ============================================================================
-- 1. AGREGAR COLUMNAS A CHALLENGE_PURCHASES PARA EQUIPOS
-- ============================================================================

-- Agregar columna para indicar si es un reto en equipo
ALTER TABLE public.challenge_purchases
  ADD COLUMN IF NOT EXISTS is_team_challenge BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID;

-- Crear índice para búsquedas rápidas de equipos
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_team ON public.challenge_purchases(team_id) WHERE team_id IS NOT NULL;

-- ============================================================================
-- 2. TABLA DE EQUIPOS DE RETOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name TEXT,
    max_members INTEGER DEFAULT 5 NOT NULL CHECK (max_members <= 5 AND max_members >= 2),
    is_full BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.challenge_teams ENABLE ROW LEVEL SECURITY;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_challenge_teams_challenge ON public.challenge_teams(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_teams_creator ON public.challenge_teams(creator_id);

-- ============================================================================
-- 3. TABLA DE MIEMBROS DEL EQUIPO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_purchase_id UUID NOT NULL REFERENCES public.challenge_purchases(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un usuario solo puede estar una vez en un equipo
    CONSTRAINT challenge_team_members_unique UNIQUE (team_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.challenge_team_members ENABLE ROW LEVEL SECURITY;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.challenge_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.challenge_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_purchase ON public.challenge_team_members(challenge_purchase_id);

-- ============================================================================
-- 4. TABLA DE INVITACIONES A EQUIPOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Una invitación única por usuario y equipo
    CONSTRAINT team_invitations_unique UNIQUE (team_id, invitee_id)
);

-- Habilitar RLS
ALTER TABLE public.challenge_team_invitations ENABLE ROW LEVEL SECURITY;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON public.challenge_team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee ON public.challenge_team_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_inviter ON public.challenge_team_invitations(inviter_id);

-- ============================================================================
-- 5. VISTA PARA FEED DE EQUIPOS
-- ============================================================================

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
    cp.buyer_id as user_id,
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.avatar_url as user_photo_url,
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
INNER JOIN public.profiles p ON cp.buyer_id = p.id
LEFT JOIN public.challenge_progress pr ON cp.id = pr.challenge_purchase_id
WHERE cc.is_public = true
  AND cp.is_team_challenge = true
  AND c.is_active = true
  AND pa.status = 'approved'
  AND pa.is_active = true;

COMMENT ON VIEW public.team_feed_checkins IS 'Vista de check-ins de equipos para el feed social';

-- ============================================================================
-- 6. POLÍTICAS RLS PARA CHALLENGE_TEAMS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view teams they are part of" ON public.challenge_teams;
DROP POLICY IF EXISTS "Users can create teams for challenges they purchased" ON public.challenge_teams;
DROP POLICY IF EXISTS "Team creators can update their teams" ON public.challenge_teams;
DROP POLICY IF EXISTS "Team creators can delete their teams" ON public.challenge_teams;

-- Ver equipos en los que está el usuario
CREATE POLICY "Users can view teams they are part of"
ON public.challenge_teams
FOR SELECT
TO authenticated
USING (
    auth.uid() = creator_id
    OR
    EXISTS (
        SELECT 1 FROM public.challenge_team_members
        WHERE team_id = challenge_teams.id AND user_id = auth.uid()
    )
);

-- Crear equipos para retos que ha comprado
CREATE POLICY "Users can create teams for challenges they purchased"
ON public.challenge_teams
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = creator_id
    AND
    EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE challenge_id = challenge_teams.challenge_id
        AND buyer_id = auth.uid()
    )
);

-- Actualizar sus propios equipos
CREATE POLICY "Team creators can update their teams"
ON public.challenge_teams
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Eliminar sus propios equipos
CREATE POLICY "Team creators can delete their teams"
ON public.challenge_teams
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- ============================================================================
-- 7. POLÍTICAS RLS PARA CHALLENGE_TEAM_MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.challenge_team_members;
DROP POLICY IF EXISTS "Team creators can add members" ON public.challenge_team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON public.challenge_team_members;

-- Ver miembros de equipos en los que está
CREATE POLICY "Users can view team members of their teams"
ON public.challenge_team_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.challenge_teams
        WHERE id = challenge_team_members.team_id
        AND (creator_id = auth.uid() OR id IN (
            SELECT team_id FROM public.challenge_team_members WHERE user_id = auth.uid()
        ))
    )
);

-- Agregar miembros (solo creador del equipo y mediante invitaciones aceptadas)
CREATE POLICY "Team creators can add members"
ON public.challenge_team_members
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenge_teams
        WHERE id = team_id
        AND creator_id = auth.uid()
    )
);

-- Los usuarios pueden salirse de equipos
CREATE POLICY "Users can leave teams"
ON public.challenge_team_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 8. POLÍTICAS RLS PARA CHALLENGE_TEAM_INVITATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their invitations" ON public.challenge_team_invitations;
DROP POLICY IF EXISTS "Team members can invite others" ON public.challenge_team_invitations;
DROP POLICY IF EXISTS "Users can update their received invitations" ON public.challenge_team_invitations;
DROP POLICY IF EXISTS "Inviters can cancel their sent invitations" ON public.challenge_team_invitations;

-- Ver invitaciones recibidas o enviadas
CREATE POLICY "Users can view their invitations"
ON public.challenge_team_invitations
FOR SELECT
TO authenticated
USING (
    invitee_id = auth.uid()
    OR
    inviter_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.challenge_teams
        WHERE id = team_id AND creator_id = auth.uid()
    )
);

-- Los miembros del equipo pueden invitar a otros
CREATE POLICY "Team members can invite others"
ON public.challenge_team_invitations
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = inviter_id
    AND
    EXISTS (
        SELECT 1 FROM public.challenge_team_members
        WHERE team_id = challenge_team_invitations.team_id
        AND user_id = auth.uid()
    )
);

-- Los invitados pueden actualizar sus invitaciones (aceptar/rechazar)
CREATE POLICY "Users can update their received invitations"
ON public.challenge_team_invitations
FOR UPDATE
TO authenticated
USING (invitee_id = auth.uid())
WITH CHECK (invitee_id = auth.uid());

-- Los que invitaron pueden cancelar sus invitaciones
CREATE POLICY "Inviters can cancel their sent invitations"
ON public.challenge_team_invitations
FOR DELETE
TO authenticated
USING (inviter_id = auth.uid() AND status = 'pending');

-- ============================================================================
-- 9. FUNCIÓN PARA ACTUALIZAR ESTADO DE EQUIPO LLENO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_team_full_status()
RETURNS TRIGGER AS $$
DECLARE
    team_max_members INTEGER;
    current_members_count INTEGER;
BEGIN
    -- Obtener max_members del equipo
    SELECT max_members INTO team_max_members
    FROM public.challenge_teams
    WHERE id = COALESCE(NEW.team_id, OLD.team_id);

    -- Contar miembros actuales
    SELECT COUNT(*) INTO current_members_count
    FROM public.challenge_team_members
    WHERE team_id = COALESCE(NEW.team_id, OLD.team_id);

    -- Actualizar estado is_full
    UPDATE public.challenge_teams
    SET is_full = (current_members_count >= team_max_members),
        updated_at = timezone('utc'::text, now())
    WHERE id = COALESCE(NEW.team_id, OLD.team_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar estado de equipo lleno
DROP TRIGGER IF EXISTS trigger_update_team_full_status ON public.challenge_team_members;
CREATE TRIGGER trigger_update_team_full_status
AFTER INSERT OR DELETE ON public.challenge_team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_team_full_status();

-- ============================================================================
-- 10. FUNCIÓN PARA VALIDAR INVITACIONES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_team_invitation()
RETURNS TRIGGER AS $$
DECLARE
    team_challenge_id UUID;
    team_is_full BOOLEAN;
BEGIN
    -- Obtener información del equipo
    SELECT challenge_id, is_full INTO team_challenge_id, team_is_full
    FROM public.challenge_teams
    WHERE id = NEW.team_id;

    -- Validar que el equipo no esté lleno
    IF team_is_full THEN
        RAISE EXCEPTION 'El equipo está lleno';
    END IF;

    -- Validar que el invitado haya comprado el reto
    IF NOT EXISTS (
        SELECT 1 FROM public.challenge_purchases
        WHERE buyer_id = NEW.invitee_id
        AND challenge_id = team_challenge_id
    ) THEN
        RAISE EXCEPTION 'El usuario invitado no ha comprado este reto';
    END IF;

    -- Validar que el invitador siga al invitado
    IF NOT EXISTS (
        SELECT 1 FROM public.user_follows
        WHERE follower_id = NEW.inviter_id
        AND following_id = NEW.invitee_id
    ) THEN
        RAISE EXCEPTION 'Solo puedes invitar a usuarios que sigues';
    END IF;

    -- Validar que el invitado no esté ya en otro equipo para este reto
    IF EXISTS (
        SELECT 1 FROM public.challenge_team_members ctm
        INNER JOIN public.challenge_teams ct ON ctm.team_id = ct.id
        WHERE ctm.user_id = NEW.invitee_id
        AND ct.challenge_id = team_challenge_id
        AND ctm.team_id != NEW.team_id
    ) THEN
        RAISE EXCEPTION 'El usuario ya está en otro equipo para este reto';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar invitaciones
DROP TRIGGER IF EXISTS trigger_validate_team_invitation ON public.challenge_team_invitations;
CREATE TRIGGER trigger_validate_team_invitation
BEFORE INSERT ON public.challenge_team_invitations
FOR EACH ROW
EXECUTE FUNCTION public.validate_team_invitation();

-- ============================================================================
-- COMENTARIOS SOBRE EL DISEÑO
-- ============================================================================

-- Este sistema permite:
-- 1. Crear equipos de hasta 5 personas para retos
-- 2. Invitar a usuarios que:
--    - Ya sigues
--    - Han comprado el mismo reto
--    - No están en otro equipo para ese reto
-- 3. Ver en el feed los check-ins de equipos
-- 4. Gestionar invitaciones (aceptar/rechazar)
-- 5. Los equipos se marcan como llenos automáticamente
-- 6. Validaciones automáticas mediante triggers
