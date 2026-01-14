-- ============================================================================
-- MIGRACIÓN 179: Configurar políticas de storage para bucket avatars
-- ============================================================================
-- Fecha: 2026-01-13
-- Propósito: Asegurar que admins puedan subir avatares para cualquier profesional
--            y que los usuarios puedan gestionar sus propios avatares
-- ============================================================================

-- Eliminar políticas existentes del bucket avatars si existen
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;

-- ============================================================================
-- POLÍTICA 1: LECTURA PÚBLICA
-- ============================================================================
-- Todos pueden ver los avatares (bucket público)
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================================
-- POLÍTICA 2: INSERCIÓN (UPLOAD)
-- ============================================================================
-- Permitir que usuarios autenticados suban sus propios avatares
-- Y que admins puedan subir avatares para cualquier profesional
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    -- Permitir si el usuario sube su propio avatar
    -- El path es: {professional_id}/{filename}
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM professional_applications
      WHERE professional_applications.user_id = auth.uid()
    )
    -- O si es admin activo (puede subir para cualquier profesional)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  )
);

-- ============================================================================
-- POLÍTICA 3: ACTUALIZACIÓN (UPDATE)
-- ============================================================================
-- Usuarios pueden actualizar sus propios avatares, admins pueden actualizar cualquier avatar
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    -- Permitir si el archivo pertenece al usuario
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM professional_applications
      WHERE professional_applications.user_id = auth.uid()
    )
    -- O si es admin activo
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM professional_applications
      WHERE professional_applications.user_id = auth.uid()
    )
    -- O si es admin activo
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  )
);

-- ============================================================================
-- POLÍTICA 4: ELIMINACIÓN (DELETE)
-- ============================================================================
-- Usuarios pueden eliminar sus propios avatares, admins pueden eliminar cualquier avatar
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    -- Permitir si el archivo pertenece al usuario
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM professional_applications
      WHERE professional_applications.user_id = auth.uid()
    )
    -- O si es admin activo
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  )
);

-- ============================================================================
-- POLÍTICA 5: ADMINS PUEDEN HACER TODO (POLÍTICA ADICIONAL DE SEGURIDAD)
-- ============================================================================
-- Esta política adicional asegura que los admins tengan acceso completo
-- incluso si hay conflictos con otras políticas
CREATE POLICY "Admins can manage all avatars"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las políticas se crearon correctamente
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Con USING'
    ELSE '❌ Sin USING'
  END as using_status,
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Con WITH CHECK'
    ELSE '❌ Sin WITH CHECK'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%avatars%'
ORDER BY policyname, cmd;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Public can view avatars" ON storage.objects IS
'Permite que cualquier usuario (incluso anónimos) pueda ver los avatares del bucket avatars';

COMMENT ON POLICY "Authenticated users can upload avatars" ON storage.objects IS
'Permite que usuarios autenticados suban sus propios avatares y que admins activos puedan subir avatares para cualquier profesional';

COMMENT ON POLICY "Users can update their own avatars" ON storage.objects IS
'Permite que usuarios actualicen sus propios avatares, y admins pueden actualizar cualquier avatar';

COMMENT ON POLICY "Users can delete their own avatars" ON storage.objects IS
'Permite que usuarios eliminen sus propios avatares, y admins pueden eliminar cualquier avatar';

COMMENT ON POLICY "Admins can manage all avatars" ON storage.objects IS
'Política adicional que asegura que administradores activos tengan acceso completo a todos los avatares del bucket avatars';
