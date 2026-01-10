-- ============================================================================
-- MIGRACIÓN 172: Sistema de Preguntas y Respuestas para Eventos
-- ============================================================================
-- Descripción: Permite que usuarios hagan preguntas sobre eventos y que
--              administradores o profesionales respondan
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE PREGUNTAS DE EVENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events_workshops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- El texto de la pregunta no puede estar vacío
    CONSTRAINT non_empty_question CHECK (length(trim(question)) > 0)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_event_questions_event_id ON public.event_questions(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_questions_user_id ON public.event_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_questions_created_at ON public.event_questions(created_at DESC);

-- ============================================================================
-- 2. TABLA DE RESPUESTAS A PREGUNTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_question_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.event_questions(id) ON DELETE CASCADE,
    answered_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_admin_answer BOOLEAN DEFAULT false NOT NULL,
    is_professional_answer BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- El texto de la respuesta no puede estar vacío
    CONSTRAINT non_empty_answer CHECK (length(trim(answer)) > 0),
    
    -- Una pregunta solo puede tener una respuesta por ahora (puede cambiarse si se necesitan múltiples respuestas)
    CONSTRAINT unique_answer_per_question UNIQUE (question_id)
);

-- Índices para respuestas
CREATE INDEX IF NOT EXISTS idx_event_question_answers_question_id ON public.event_question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_event_question_answers_answered_by ON public.event_question_answers(answered_by_user_id);
CREATE INDEX IF NOT EXISTS idx_event_question_answers_created_at ON public.event_question_answers(created_at DESC);

-- ============================================================================
-- 3. HABILITAR RLS
-- ============================================================================

ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_question_answers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. POLÍTICAS RLS PARA EVENT_QUESTIONS
-- ============================================================================

-- Todos los usuarios autenticados pueden ver preguntas de eventos activos
CREATE POLICY "Anyone can view questions for active events"
ON public.event_questions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events_workshops
        WHERE id = event_id AND is_active = true
    )
);

-- Los usuarios pueden crear preguntas en eventos activos
CREATE POLICY "Users can create questions for active events"
ON public.event_questions
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.events_workshops
        WHERE id = event_id AND is_active = true
    )
);

-- Los usuarios pueden editar sus propias preguntas (solo si no tienen respuesta)
CREATE POLICY "Users can update their own unanswered questions"
ON public.event_questions
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.event_question_answers
        WHERE question_id = id
    )
);

-- Los usuarios pueden eliminar sus propias preguntas (solo si no tienen respuesta)
CREATE POLICY "Users can delete their own unanswered questions"
ON public.event_questions
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.event_question_answers
        WHERE question_id = id
    )
);

-- ============================================================================
-- 5. POLÍTICAS RLS PARA EVENT_QUESTION_ANSWERS
-- ============================================================================

-- Todos los usuarios autenticados pueden ver respuestas
CREATE POLICY "Anyone can view answers"
ON public.event_question_answers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_questions eq
        JOIN public.events_workshops ew ON ew.id = eq.event_id
        WHERE eq.id = question_id AND ew.is_active = true
    )
);

-- Solo admins y profesionales pueden crear respuestas
CREATE POLICY "Admins and professionals can create answers"
ON public.event_question_answers
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = answered_by_user_id
    AND (
        -- Es admin
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND type = 'admin'
        )
        OR
        -- Es profesional del evento
        EXISTS (
            SELECT 1 FROM public.event_questions eq
            JOIN public.events_workshops ew ON ew.id = eq.event_id
            JOIN public.professional_applications pa ON pa.id = ew.professional_id
            WHERE eq.id = question_id
            AND pa.user_id = auth.uid()
            AND pa.status = 'approved'
        )
    )
);

-- Solo el que respondió puede editar su respuesta
CREATE POLICY "Answer authors can update their answers"
ON public.event_question_answers
FOR UPDATE
TO authenticated
USING (auth.uid() = answered_by_user_id);

-- Solo el que respondió puede eliminar su respuesta
CREATE POLICY "Answer authors can delete their answers"
ON public.event_question_answers
FOR DELETE
TO authenticated
USING (auth.uid() = answered_by_user_id);

-- ============================================================================
-- 6. FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_event_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_questions_updated_at
    BEFORE UPDATE ON public.event_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_event_questions_updated_at();

CREATE TRIGGER trigger_update_event_question_answers_updated_at
    BEFORE UPDATE ON public.event_question_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_event_questions_updated_at();

-- Función para determinar automáticamente si es respuesta de admin o profesional
CREATE OR REPLACE FUNCTION set_answer_type()
RETURNS TRIGGER AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_professional BOOLEAN;
    v_event_professional_id UUID;
BEGIN
    -- Verificar si es admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.answered_by_user_id AND type = 'admin'
    ) INTO v_is_admin;

    -- Obtener professional_id del evento
    SELECT ew.professional_id INTO v_event_professional_id
    FROM public.event_questions eq
    JOIN public.events_workshops ew ON ew.id = eq.event_id
    WHERE eq.id = NEW.question_id;

    -- Verificar si es el profesional del evento
    IF v_event_professional_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.professional_applications
            WHERE id = v_event_professional_id
            AND user_id = NEW.answered_by_user_id
            AND status = 'approved'
        ) INTO v_is_professional;
    END IF;

    -- Establecer flags
    NEW.is_admin_answer := v_is_admin;
    NEW.is_professional_answer := COALESCE(v_is_professional, false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_answer_type
    BEFORE INSERT ON public.event_question_answers
    FOR EACH ROW
    EXECUTE FUNCTION set_answer_type();

-- ============================================================================
-- 7. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.event_questions IS 'Preguntas de usuarios sobre eventos';
COMMENT ON TABLE public.event_question_answers IS 'Respuestas a preguntas de eventos (por admins o profesionales)';
COMMENT ON COLUMN public.event_question_answers.is_admin_answer IS 'Indica si la respuesta fue dada por un administrador';
COMMENT ON COLUMN public.event_question_answers.is_professional_answer IS 'Indica si la respuesta fue dada por el profesional del evento';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
