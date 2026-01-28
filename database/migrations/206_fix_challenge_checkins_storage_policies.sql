-- ============================================================================
-- MIGRACIÓN 206: Corregir políticas RLS de storage para check-ins de challenges
-- ============================================================================
-- Problema: Los participantes invitados a retos creados por profesionales
-- no pueden subir imágenes en sus check-ins debido a políticas RLS incorrectas
-- ============================================================================

-- Eliminar política existente de INSERT si existe
DROP POLICY IF EXISTS "Authenticated users can upload to challenges" ON storage.objects;

-- Crear nueva política que permite:
-- 1. Creadores de retos pueden subir a carpetas con challenge_id
-- 2. Participantes pueden subir evidencia a sus propias carpetas de check-ins
-- El path es: {challenge_purchase_id}/evidence/{fileName}
CREATE POLICY "Authenticated users can upload to challenges"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'challenges'
    AND (
        -- Creadores pueden subir a carpetas con challenge_id directamente
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenges
            WHERE created_by_user_id = auth.uid()
        )
        OR
        -- Participantes pueden subir evidencia a sus propias carpetas de check-ins
        -- El path es: {challenge_purchase_id}/evidence/{fileName}
        -- Verificamos que el challenge_purchase_id pertenece al usuario
        -- Y que tiene access_granted = true
        (storage.foldername(name))[2] = 'evidence'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenge_purchases
            WHERE participant_id = auth.uid()
            AND access_granted = true
        )
    )
);

-- Actualizar política de UPDATE para incluir evidencia de check-ins
DROP POLICY IF EXISTS "Creators can update their own challenges files" ON storage.objects;

CREATE POLICY "Creators can update their own challenges files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'challenges'
    AND (
        -- Creadores pueden actualizar archivos de sus retos
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenges
            WHERE created_by_user_id = auth.uid()
        )
        OR
        -- Participantes pueden actualizar su propia evidencia
        (storage.foldername(name))[2] = 'evidence'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenge_purchases
            WHERE participant_id = auth.uid()
            AND access_granted = true
        )
    )
)
WITH CHECK (
    bucket_id = 'challenges'
    AND (
        -- Creadores pueden actualizar archivos de sus retos
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenges
            WHERE created_by_user_id = auth.uid()
        )
        OR
        -- Participantes pueden actualizar su propia evidencia
        (storage.foldername(name))[2] = 'evidence'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenge_purchases
            WHERE participant_id = auth.uid()
            AND access_granted = true
        )
    )
);

-- Actualizar política de DELETE para incluir evidencia de check-ins
DROP POLICY IF EXISTS "Creators can delete their own challenges files" ON storage.objects;

CREATE POLICY "Creators can delete their own challenges files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'challenges'
    AND (
        -- Creadores pueden eliminar archivos de sus retos
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenges
            WHERE created_by_user_id = auth.uid()
        )
        OR
        -- Participantes pueden eliminar su propia evidencia
        (storage.foldername(name))[2] = 'evidence'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenge_purchases
            WHERE participant_id = auth.uid()
            AND access_granted = true
        )
    )
);

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can upload to challenges" ON storage.objects IS 
'Permite a creadores de retos y participantes (con access_granted=true) subir archivos al bucket challenges';

COMMENT ON POLICY "Creators can update their own challenges files" ON storage.objects IS 
'Permite a creadores y participantes actualizar sus propios archivos en el bucket challenges';

COMMENT ON POLICY "Creators can delete their own challenges files" ON storage.objects IS 
'Permite a creadores y participantes eliminar sus propios archivos en el bucket challenges';
