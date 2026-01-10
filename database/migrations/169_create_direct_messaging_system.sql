-- ============================================================================
-- MIGRACIÓN 169: Sistema de Mensajería Directa
-- ============================================================================
-- Descripción: Permite que usuarios (pacientes) envíen mensajes a profesionales
-- Características:
--   - Conversaciones entre usuarios y profesionales
--   - Mensajes directos
--   - Indicadores de lectura
--   - Notificaciones automáticas
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE CONVERSACIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.direct_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_preview TEXT,
    user_unread_count INTEGER DEFAULT 0 NOT NULL,
    professional_unread_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Una conversación única por par usuario-profesional
    CONSTRAINT unique_user_professional_conversation UNIQUE (user_id, professional_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user_id ON public.direct_conversations(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_professional_id ON public.direct_conversations(professional_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_last_message_at ON public.direct_conversations(last_message_at DESC);

-- ============================================================================
-- 2. TABLA DE MENSAJES DIRECTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'professional')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- El mensaje no puede estar vacío
    CONSTRAINT non_empty_message_content CHECK (length(trim(content)) > 0)
);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_read ON public.direct_messages(conversation_id, is_read);

-- ============================================================================
-- 3. HABILITAR RLS
-- ============================================================================

ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. POLÍTICAS RLS PARA DIRECT_CONVERSATIONS
-- ============================================================================

-- Los usuarios pueden ver sus propias conversaciones
CREATE POLICY "Users can view their own conversations"
ON public.direct_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los profesionales pueden ver conversaciones donde son el profesional
CREATE POLICY "Professionals can view their conversations"
ON public.direct_conversations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = professional_id AND user_id = auth.uid()
    )
);

-- Los usuarios pueden crear conversaciones
CREATE POLICY "Users can create conversations"
ON public.direct_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus conversaciones (para actualizar contadores de no leídos)
CREATE POLICY "Users can update their conversations"
ON public.direct_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.professional_applications
    WHERE id = professional_id AND user_id = auth.uid()
));

-- ============================================================================
-- 5. POLÍTICAS RLS PARA DIRECT_MESSAGES
-- ============================================================================

-- Los usuarios pueden ver mensajes de sus conversaciones
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.direct_conversations
        WHERE id = conversation_id
        AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.professional_applications
            WHERE id = professional_id AND user_id = auth.uid()
        ))
    )
);

-- Los usuarios pueden enviar mensajes en conversaciones donde participan
CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.direct_conversations
        WHERE id = conversation_id
        AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.professional_applications
            WHERE id = professional_id AND user_id = auth.uid()
        ))
    )
);

-- Los usuarios pueden actualizar sus propios mensajes (marcar como leído)
CREATE POLICY "Users can update messages in their conversations"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.direct_conversations
        WHERE id = conversation_id
        AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.professional_applications
            WHERE id = professional_id AND user_id = auth.uid()
        ))
    )
);

-- ============================================================================
-- 6. FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_direct_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_direct_conversations_updated_at
    BEFORE UPDATE ON public.direct_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_conversations_updated_at();

CREATE TRIGGER trigger_update_direct_messages_updated_at
    BEFORE UPDATE ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_conversations_updated_at();

-- Función para actualizar conversación cuando se envía un mensaje
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_professional_id UUID;
    v_sender_type TEXT;
BEGIN
    -- Obtener información de la conversación
    SELECT user_id, professional_id INTO v_user_id, v_professional_id
    FROM public.direct_conversations
    WHERE id = NEW.conversation_id;

    -- Determinar tipo de remitente
    IF NEW.sender_id = v_user_id THEN
        v_sender_type := 'user';
    ELSE
        v_sender_type := 'professional';
    END IF;

    -- Actualizar conversación
    UPDATE public.direct_conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = timezone('utc'::text, now()),
        -- Incrementar contador de no leídos para el receptor
        user_unread_count = CASE 
            WHEN v_sender_type = 'professional' THEN user_unread_count + 1
            ELSE user_unread_count
        END,
        professional_unread_count = CASE 
            WHEN v_sender_type = 'user' THEN professional_unread_count + 1
            ELSE professional_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Función para actualizar contadores cuando se marca un mensaje como leído
CREATE OR REPLACE FUNCTION update_unread_count_on_read()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_professional_id UUID;
    v_sender_type TEXT;
BEGIN
    -- Solo procesar si el mensaje cambió a leído
    IF NEW.is_read = true AND (OLD.is_read = false OR OLD.is_read IS NULL) THEN
        -- Obtener información de la conversación
        SELECT user_id, professional_id INTO v_user_id, v_professional_id
        FROM public.direct_conversations
        WHERE id = NEW.conversation_id;

        -- Obtener tipo de remitente
        SELECT sender_type INTO v_sender_type
        FROM public.direct_messages
        WHERE id = NEW.id;

        -- Actualizar contador de no leídos
        UPDATE public.direct_conversations
        SET 
            user_unread_count = CASE 
                WHEN v_sender_type = 'user' THEN GREATEST(0, user_unread_count - 1)
                ELSE user_unread_count
            END,
            professional_unread_count = CASE 
                WHEN v_sender_type = 'professional' THEN GREATEST(0, professional_unread_count - 1)
                ELSE professional_unread_count
            END
        WHERE id = NEW.conversation_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_unread_count_on_read
    AFTER UPDATE ON public.direct_messages
    FOR EACH ROW
    WHEN (OLD.is_read IS DISTINCT FROM NEW.is_read)
    EXECUTE FUNCTION update_unread_count_on_read();

-- ============================================================================
-- 7. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.direct_conversations IS 'Conversaciones entre usuarios (pacientes) y profesionales';
COMMENT ON TABLE public.direct_messages IS 'Mensajes directos entre usuarios y profesionales';
COMMENT ON COLUMN public.direct_conversations.user_unread_count IS 'Número de mensajes no leídos por el usuario';
COMMENT ON COLUMN public.direct_conversations.professional_unread_count IS 'Número de mensajes no leídos por el profesional';
COMMENT ON COLUMN public.direct_messages.sender_type IS 'Tipo de remitente: user (paciente) o professional';
