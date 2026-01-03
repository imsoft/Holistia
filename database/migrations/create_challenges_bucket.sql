-- Migración: Crear políticas de storage para challenges
-- Este bucket almacenará las imágenes de portada y archivos de retos (challenges)

-- ============================================================================
-- INSTRUCCIONES PARA CREAR EL BUCKET (DESDE DASHBOARD)
-- ============================================================================
-- IMPORTANTE: Antes de ejecutar este script, crea el bucket desde el Dashboard de Supabase:
--
-- 1. Ve a Storage en el dashboard de Supabase
-- 2. Haz clic en "New bucket"
-- 3. Nombre: challenges
-- 4. Public: ✅ (activado) - para que las imágenes sean accesibles públicamente
-- 5. File size limit: 50 MB (52428800 bytes)
-- 6. Allowed MIME types: (dejar en blanco o especificar):
--    - image/jpeg, image/jpg, image/png, image/webp, image/gif
--    - application/pdf
--    - audio/mpeg, audio/mp3, audio/wav
--    - video/mp4, video/quicktime
--    - application/zip, application/x-zip-compressed
--
-- Después de crear el bucket, ejecuta este script para crear las políticas
-- ============================================================================

-- ============================================================================
-- POLÍTICAS DE STORAGE
-- ============================================================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Authenticated users can upload to challenges" ON storage.objects;
DROP POLICY IF EXISTS "Public can view challenges files" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete their own challenges files" ON storage.objects;
DROP POLICY IF EXISTS "Creators can update their own challenges files" ON storage.objects;

-- Política de LECTURA: Todos pueden ver archivos en challenges (bucket público)
CREATE POLICY "Public can view challenges files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'challenges');

-- Política de INSERCIÓN: Usuarios autenticados pueden subir archivos a sus propios retos
CREATE POLICY "Authenticated users can upload to challenges"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'challenges'
    AND (storage.foldername(name))[1] IN (
        -- Permitir subir en carpetas con UUID (challenge_id) donde el usuario es el creador
        SELECT id::text FROM challenges
        WHERE created_by_user_id = auth.uid()
    )
);

-- Política de ACTUALIZACIÓN: Creadores pueden actualizar archivos de sus retos
CREATE POLICY "Creators can update their own challenges files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'challenges'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM challenges
        WHERE created_by_user_id = auth.uid()
    )
);

-- Política de ELIMINACIÓN: Creadores pueden eliminar archivos de sus retos
CREATE POLICY "Creators can delete their own challenges files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'challenges'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM challenges
        WHERE created_by_user_id = auth.uid()
    )
);

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

-- Nota: No se pueden agregar comentarios a las tablas de storage sin permisos de propietario
-- Los buckets deben crearse desde el Dashboard de Supabase
