-- ============================================================================
-- MIGRACIÓN 227: Tokens de push para la app móvil (Expo)
-- ============================================================================
-- Permite guardar el Expo Push Token por usuario/dispositivo para enviar
-- notificaciones push desde el backend (ej. recordatorios de cita, mensajes).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede insertar/actualizar/ver sus tokens
CREATE POLICY "Users can manage own push tokens"
ON public.user_push_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_push_tokens IS 'Tokens Expo Push por usuario para notificaciones en la app móvil';
