-- ============================================================================
-- MIGRACIÓN 207: Permitir que el profesional creador del reto pueda chatear
-- ============================================================================
-- Problema: Solo los participantes pueden chatear, pero el profesional creador
-- del reto también debería poder participar en el chat
-- ============================================================================

-- ============================================================================
-- 1. ACTUALIZAR POLÍTICAS RLS PARA CHALLENGE_CONVERSATIONS
-- ============================================================================

-- Eliminar política existente de SELECT
DROP POLICY IF EXISTS "Challenge participants can view conversations" ON public.challenge_conversations;

-- Crear nueva política que permite a participantes Y al creador del reto ver conversaciones
CREATE POLICY "Challenge participants and creators can view conversations"
ON public.challenge_conversations
FOR SELECT
TO authenticated
USING (
    -- Participantes pueden ver la conversación
    EXISTS (
        SELECT 1
        FROM public.challenge_purchases cp
        WHERE cp.challenge_id = challenge_conversations.challenge_id
        AND cp.participant_id = auth.uid()
        AND cp.access_granted = true
    )
    OR
    -- El creador del reto también puede ver la conversación
    EXISTS (
        SELECT 1
        FROM public.challenges c
        WHERE c.id = challenge_conversations.challenge_id
        AND c.created_by_user_id = auth.uid()
    )
);

-- Eliminar política existente de INSERT
DROP POLICY IF EXISTS "Challenge participants can create conversations" ON public.challenge_conversations;

-- Crear nueva política que permite a participantes Y al creador crear conversaciones
CREATE POLICY "Challenge participants and creators can create conversations"
ON public.challenge_conversations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Participantes pueden crear conversaciones
    EXISTS (
        SELECT 1
        FROM public.challenge_purchases cp
        WHERE cp.challenge_id = challenge_conversations.challenge_id
        AND cp.participant_id = auth.uid()
        AND cp.access_granted = true
    )
    OR
    -- El creador del reto también puede crear conversaciones
    EXISTS (
        SELECT 1
        FROM public.challenges c
        WHERE c.id = challenge_conversations.challenge_id
        AND c.created_by_user_id = auth.uid()
    )
);

-- ============================================================================
-- 2. ACTUALIZAR POLÍTICAS RLS PARA CHALLENGE_MESSAGES
-- ============================================================================

-- Eliminar política existente de SELECT
DROP POLICY IF EXISTS "Challenge participants can view messages" ON public.challenge_messages;

-- Crear nueva política que permite a participantes Y al creador ver mensajes
CREATE POLICY "Challenge participants and creators can view messages"
ON public.challenge_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.challenge_conversations cc
        WHERE cc.id = challenge_messages.conversation_id
        AND (
            -- Participantes pueden ver mensajes
            EXISTS (
                SELECT 1
                FROM public.challenge_purchases cp
                WHERE cp.challenge_id = cc.challenge_id
                AND cp.participant_id = auth.uid()
                AND cp.access_granted = true
            )
            OR
            -- El creador del reto también puede ver mensajes
            EXISTS (
                SELECT 1
                FROM public.challenges c
                WHERE c.id = cc.challenge_id
                AND c.created_by_user_id = auth.uid()
            )
        )
    )
);

-- Eliminar política existente de INSERT
DROP POLICY IF EXISTS "Challenge participants can send messages" ON public.challenge_messages;

-- Crear nueva política que permite a participantes Y al creador enviar mensajes
CREATE POLICY "Challenge participants and creators can send messages"
ON public.challenge_messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.challenge_conversations cc
        WHERE cc.id = challenge_messages.conversation_id
        AND (
            -- Participantes pueden enviar mensajes
            EXISTS (
                SELECT 1
                FROM public.challenge_purchases cp
                WHERE cp.challenge_id = cc.challenge_id
                AND cp.participant_id = auth.uid()
                AND cp.access_granted = true
            )
            OR
            -- El creador del reto también puede enviar mensajes
            EXISTS (
                SELECT 1
                FROM public.challenges c
                WHERE c.id = cc.challenge_id
                AND c.created_by_user_id = auth.uid()
            )
        )
    )
);

-- Las políticas de UPDATE y DELETE ya permiten que cualquier usuario edite/elimine
-- sus propios mensajes, así que no necesitan cambios

-- ============================================================================
-- 3. ACTUALIZAR FUNCIÓN PARA CREAR CONVERSACIÓN
-- ============================================================================
-- La función create_challenge_conversation_if_needed ya crea conversaciones
-- cuando hay participantes, pero también debería crear si el creador quiere chatear
-- aunque no haya participantes aún. Sin embargo, por ahora mantenemos la lógica
-- de mínimo 2 participantes para evitar conversaciones vacías.

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Challenge participants and creators can view conversations" ON public.challenge_conversations IS 
'Permite a participantes y al creador del reto ver conversaciones';

COMMENT ON POLICY "Challenge participants and creators can create conversations" ON public.challenge_conversations IS 
'Permite a participantes y al creador del reto crear conversaciones';

COMMENT ON POLICY "Challenge participants and creators can view messages" ON public.challenge_messages IS 
'Permite a participantes y al creador del reto ver mensajes';

COMMENT ON POLICY "Challenge participants and creators can send messages" ON public.challenge_messages IS 
'Permite a participantes y al creador del reto enviar mensajes';
