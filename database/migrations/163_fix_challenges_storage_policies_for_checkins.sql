-- ============================================================================
-- MIGRACIÓN 163: Corregir políticas RLS de storage para check-ins de challenges
-- ============================================================================
-- Problema: La política actual solo permite subir archivos si el usuario es
-- el creador del reto, pero los participantes necesitan subir evidencia de
-- check-ins a sus propias carpetas {challenge_purchase_id}/evidence/
-- ============================================================================

-- Eliminar política existente de INSERT
DROP POLICY IF EXISTS "Authenticated users can upload to challenges" ON storage.objects;

-- Crear nueva política que permite:
-- 1. Creadores de retos pueden subir a carpetas con challenge_id
-- 2. Participantes pueden subir evidencia a sus propias carpetas de check-ins
CREATE POLICY "Authenticated users can upload to challenges"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'challenges'
    AND (
        -- Creadores pueden subir a carpetas con challenge_id
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenges
            WHERE created_by_user_id = auth.uid()
        )
        OR
        -- Participantes pueden subir evidencia a sus propias carpetas de check-ins
        -- El path es: {challenge_purchase_id}/evidence/{fileName}
        -- Verificamos que el challenge_purchase_id pertenece al usuario
        (storage.foldername(name))[2] = 'evidence'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.challenge_purchases
            WHERE participant_id = auth.uid()
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
        )
    )
);
