-- ============================================================================
-- MIGRACIÓN 213: Arreglar eliminación en cascada de conversaciones directas
-- ============================================================================
-- Descripción: Cambiar ON DELETE CASCADE a ON DELETE SET NULL para evitar
--              que las conversaciones se eliminen cuando un usuario o profesional
--              es desactivado/eliminado. En su lugar, marcar como archivadas.
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR CAMPOS PARA MANEJAR USUARIOS/PROFESIONALES ELIMINADOS
-- ============================================================================

-- Agregar campos para rastrear si usuario o profesional fue eliminado
ALTER TABLE public.direct_conversations
ADD COLUMN IF NOT EXISTS user_deleted BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS professional_deleted BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL;

-- Índice para conversaciones archivadas
CREATE INDEX IF NOT EXISTS idx_direct_conversations_archived 
ON public.direct_conversations(archived) 
WHERE archived = false;

-- ============================================================================
-- 2. ELIMINAR CONSTRAINTS EXISTENTES CON CASCADE
-- ============================================================================

-- Eliminar constraint de user_id con CASCADE
ALTER TABLE public.direct_conversations
DROP CONSTRAINT IF EXISTS direct_conversations_user_id_fkey;

-- Eliminar constraint de professional_id con CASCADE
ALTER TABLE public.direct_conversations
DROP CONSTRAINT IF EXISTS direct_conversations_professional_id_fkey;

-- ============================================================================
-- 3. AGREGAR NUEVOS CONSTRAINTS CON SET NULL
-- ============================================================================

-- Agregar constraint de user_id con SET NULL
ALTER TABLE public.direct_conversations
ADD CONSTRAINT direct_conversations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Agregar constraint de professional_id con SET NULL
ALTER TABLE public.direct_conversations
ADD CONSTRAINT direct_conversations_professional_id_fkey
FOREIGN KEY (professional_id)
REFERENCES public.professional_applications(id)
ON DELETE SET NULL;

-- ============================================================================
-- 4. PERMITIR NULL EN user_id Y professional_id
-- ============================================================================

-- Permitir NULL en user_id (cuando el usuario es eliminado)
ALTER TABLE public.direct_conversations
ALTER COLUMN user_id DROP NOT NULL;

-- Permitir NULL en professional_id (cuando el profesional es eliminado)
ALTER TABLE public.direct_conversations
ALTER COLUMN professional_id DROP NOT NULL;

-- ============================================================================
-- 5. CREAR FUNCIÓN PARA MARCAR CONVERSACIONES COMO ARCHIVADAS
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_conversation_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar conversaciones como archivadas cuando user_id es NULL
    IF NEW.user_id IS NULL AND OLD.user_id IS NOT NULL THEN
        NEW.user_deleted := true;
        NEW.archived := true;
    END IF;
    
    -- Marcar conversaciones como archivadas cuando professional_id es NULL
    IF NEW.professional_id IS NULL AND OLD.professional_id IS NOT NULL THEN
        NEW.professional_deleted := true;
        NEW.archived := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREAR TRIGGER PARA ARCHIVAR AUTOMÁTICAMENTE
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_archive_conversation_on_delete ON public.direct_conversations;

CREATE TRIGGER trigger_archive_conversation_on_delete
    BEFORE UPDATE ON public.direct_conversations
    FOR EACH ROW
    WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id OR OLD.professional_id IS DISTINCT FROM NEW.professional_id)
    EXECUTE FUNCTION archive_conversation_on_user_delete();

-- ============================================================================
-- 7. ACTUALIZAR POLÍTICAS RLS PARA EXCLUIR CONVERSACIONES ARCHIVADAS
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.direct_conversations;
DROP POLICY IF EXISTS "Professionals can view their conversations" ON public.direct_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.direct_conversations;

-- Recrear políticas excluyendo conversaciones archivadas

-- Los usuarios pueden ver sus propias conversaciones (no archivadas)
CREATE POLICY "Users can view their own conversations"
ON public.direct_conversations
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    AND archived = false
    AND user_deleted = false
);

-- Los profesionales pueden ver conversaciones donde son el profesional (no archivadas)
CREATE POLICY "Professionals can view their conversations"
ON public.direct_conversations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = professional_id 
        AND user_id = auth.uid()
        AND status = 'approved'
    )
    AND archived = false
    AND professional_deleted = false
);

-- Los usuarios pueden actualizar sus conversaciones (para actualizar contadores de no leídos)
CREATE POLICY "Users can update their conversations"
ON public.direct_conversations
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.professional_applications
        WHERE id = professional_id AND user_id = auth.uid()
    ))
    AND archived = false
);

-- ============================================================================
-- 8. COMENTARIOS
-- ============================================================================

COMMENT ON COLUMN public.direct_conversations.user_deleted IS 'Indica si el usuario fue eliminado';
COMMENT ON COLUMN public.direct_conversations.professional_deleted IS 'Indica si el profesional fue eliminado';
COMMENT ON COLUMN public.direct_conversations.archived IS 'Indica si la conversación está archivada (por eliminación de usuario/profesional)';
