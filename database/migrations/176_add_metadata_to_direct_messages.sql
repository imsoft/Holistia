-- ============================================================================
-- MIGRACIÓN 176: Agregar campo metadata a direct_messages
-- ============================================================================
-- Descripción: Permite guardar metadata (como service_id) en mensajes directos
-- Características:
--   - Campo JSONB metadata para almacenar información adicional
--   - Permite enviar servicios como cards en el chat
-- ============================================================================

-- Agregar columna metadata a direct_messages
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Crear índice para búsquedas por metadata (opcional, útil para búsquedas de servicios)
CREATE INDEX IF NOT EXISTS idx_direct_messages_metadata_service_id 
ON public.direct_messages 
USING GIN ((metadata->>'service_id'));

-- Comentario
COMMENT ON COLUMN public.direct_messages.metadata IS 'Metadata adicional del mensaje (ej: service_id para servicios compartidos)';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
