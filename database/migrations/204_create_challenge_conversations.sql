-- Migración 204: Sistema de conversaciones y chat para participantes de retos
-- Permite que los participantes de un reto (2-5 personas) puedan chatear entre sí

-- ============================================================================
-- 1. TABLA DE CONVERSACIONES DE RETOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Una conversación única por reto
    CONSTRAINT unique_challenge_conversation UNIQUE (challenge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_challenge_conversations_challenge_id ON public.challenge_conversations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_conversations_updated_at ON public.challenge_conversations(updated_at DESC);

-- ============================================================================
-- 2. TABLA DE MENSAJES DE RETOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.challenge_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- El mensaje no puede estar vacío
    CONSTRAINT non_empty_challenge_message_content CHECK (length(trim(content)) > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_challenge_messages_conversation_id ON public.challenge_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_messages_sender_id ON public.challenge_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_challenge_messages_created_at ON public.challenge_messages(created_at DESC);

-- ============================================================================
-- 3. TABLA DE LECTURAS DE MENSAJES (opcional, para indicadores de lectura)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.challenge_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Un usuario solo puede marcar un mensaje como leído una vez
    CONSTRAINT unique_challenge_message_read UNIQUE (message_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_challenge_message_reads_message_id ON public.challenge_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_challenge_message_reads_user_id ON public.challenge_message_reads(user_id);

-- ============================================================================
-- 4. HABILITAR RLS
-- ============================================================================

ALTER TABLE public.challenge_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_message_reads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. POLÍTICAS RLS PARA CHALLENGE_CONVERSATIONS
-- ============================================================================

-- Los participantes del reto pueden ver la conversación
CREATE POLICY "Challenge participants can view conversations"
ON public.challenge_conversations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.challenge_purchases cp
        WHERE cp.challenge_id = challenge_conversations.challenge_id
        AND cp.participant_id = auth.uid()
        AND cp.access_granted = true
    )
);

-- Los participantes del reto pueden crear conversaciones (si no existe)
CREATE POLICY "Challenge participants can create conversations"
ON public.challenge_conversations
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.challenge_purchases cp
        WHERE cp.challenge_id = challenge_conversations.challenge_id
        AND cp.participant_id = auth.uid()
        AND cp.access_granted = true
    )
);

-- ============================================================================
-- 6. POLÍTICAS RLS PARA CHALLENGE_MESSAGES
-- ============================================================================

-- Los participantes del reto pueden ver mensajes
CREATE POLICY "Challenge participants can view messages"
ON public.challenge_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.challenge_conversations cc
        JOIN public.challenge_purchases cp ON cp.challenge_id = cc.challenge_id
        WHERE cc.id = challenge_messages.conversation_id
        AND cp.participant_id = auth.uid()
        AND cp.access_granted = true
    )
);

-- Los participantes del reto pueden enviar mensajes
CREATE POLICY "Challenge participants can send messages"
ON public.challenge_messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.challenge_conversations cc
        JOIN public.challenge_purchases cp ON cp.challenge_id = cc.challenge_id
        WHERE cc.id = challenge_messages.conversation_id
        AND cp.participant_id = auth.uid()
        AND cp.access_granted = true
    )
);

-- Los participantes pueden actualizar sus propios mensajes
CREATE POLICY "Challenge participants can update own messages"
ON public.challenge_messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Los participantes pueden eliminar sus propios mensajes
CREATE POLICY "Challenge participants can delete own messages"
ON public.challenge_messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- ============================================================================
-- 7. POLÍTICAS RLS PARA CHALLENGE_MESSAGE_READS
-- ============================================================================

-- Los participantes pueden marcar mensajes como leídos
CREATE POLICY "Challenge participants can mark messages as read"
ON public.challenge_message_reads
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 8. FUNCIÓN PARA CREAR CONVERSACIÓN AUTOMÁTICAMENTE AL CREAR RETO CON PARTICIPANTES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_challenge_conversation_if_needed()
RETURNS TRIGGER AS $$
DECLARE
    participant_count INTEGER;
    conversation_exists BOOLEAN;
BEGIN
    -- Contar participantes del reto
    SELECT COUNT(*) INTO participant_count
    FROM public.challenge_purchases
    WHERE challenge_id = NEW.challenge_id
    AND access_granted = true;

    -- Solo crear conversación si hay al menos 2 participantes (reto en equipo)
    IF participant_count >= 2 THEN
        -- Verificar si ya existe una conversación
        SELECT EXISTS (
            SELECT 1 FROM public.challenge_conversations
            WHERE challenge_id = NEW.challenge_id
        ) INTO conversation_exists;

        -- Crear conversación si no existe
        IF NOT conversation_exists THEN
            INSERT INTO public.challenge_conversations (challenge_id)
            VALUES (NEW.challenge_id)
            ON CONFLICT (challenge_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear conversación cuando se agrega un participante
CREATE TRIGGER trigger_create_challenge_conversation
AFTER INSERT ON public.challenge_purchases
FOR EACH ROW
WHEN (NEW.access_granted = true)
EXECUTE FUNCTION public.create_challenge_conversation_if_needed();

-- ============================================================================
-- 9. FUNCIÓN PARA ACTUALIZAR updated_at EN CONVERSACIONES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_challenge_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.challenge_conversations
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp cuando se envía un mensaje
CREATE TRIGGER trigger_update_challenge_conversation_timestamp
AFTER INSERT ON public.challenge_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_challenge_conversation_timestamp();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.challenge_conversations IS 'Conversaciones de chat para participantes de retos (mínimo 2 participantes)';
COMMENT ON TABLE public.challenge_messages IS 'Mensajes en conversaciones de retos';
COMMENT ON TABLE public.challenge_message_reads IS 'Registro de mensajes leídos por participantes';
COMMENT ON FUNCTION public.create_challenge_conversation_if_needed IS 'Crea automáticamente una conversación cuando un reto tiene al menos 2 participantes';
