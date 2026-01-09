-- ============================================================================
-- MIGRACIÓN 165: Crear o corregir tabla de notificaciones
-- ============================================================================
-- Problema: La tabla notifications no existe en la base de datos
-- Solución: Crear la tabla si no existe y actualizar referencias a columnas obsoletas
-- ============================================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'team_invitation',
        'invitation_accepted',
        'invitation_rejected',
        'team_checkin',
        'new_follower',
        'post_like',
        'post_comment',
        'comment_mention',
        'team_member_joined',
        'team_member_left',
        'challenge_completed',
        'streak_milestone',
        'badge_earned',
        'team_message',
        'post_reaction'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    action_url TEXT,
    -- Metadata como JSON para información adicional
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Referencias opcionales según el tipo
    related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    related_team_id UUID REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
    related_checkin_id UUID REFERENCES public.challenge_checkins(id) ON DELETE CASCADE,
    related_comment_id UUID REFERENCES public.challenge_checkin_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(user_id, type);

-- ============================================================================
-- POLÍTICAS RLS PARA NOTIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Ver propias notificaciones
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Actualizar propias notificaciones (marcar como leídas)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- El sistema puede crear notificaciones
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- ACTUALIZAR CONSTRAINT DE TIPO SI LA TABLA YA EXISTÍA
-- ============================================================================

-- Actualizar constraint de tipo para incluir nuevos tipos
DO $$
BEGIN
    -- Eliminar constraint anterior si existe
    ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

    -- Crear constraint actualizado
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check CHECK (type IN (
        'team_invitation',
        'invitation_accepted',
        'invitation_rejected',
        'team_checkin',
        'new_follower',
        'post_like',
        'post_comment',
        'comment_mention',
        'team_member_joined',
        'team_member_left',
        'challenge_completed',
        'streak_milestone',
        'badge_earned',
        'team_message',
        'post_reaction'
    ));
EXCEPTION
    WHEN duplicate_object THEN
        -- Si el constraint ya existe, no hacer nada
        NULL;
END $$;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'Sistema de notificaciones en tiempo real para la plataforma';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación: team_invitation, invitation_accepted, etc.';
COMMENT ON COLUMN public.notifications.metadata IS 'Información adicional en formato JSON';
