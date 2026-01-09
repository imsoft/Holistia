-- ============================================================================
-- MIGRACIÓN 160: Corregir políticas de storage para admins en digital-products
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Asegurar que los admins puedan subir archivos al bucket digital-products
--            sin restricciones, mientras que los profesionales solo pueden subir
--            si están aprobados
-- ============================================================================

-- Eliminar TODAS las políticas existentes del bucket digital-products
DROP POLICY IF EXISTS "Public can view digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to digital-products" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can update their own digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can delete their own digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage digital-products files" ON storage.objects;

-- ============================================================================
-- POLÍTICA 1: LECTURA PÚBLICA
-- ============================================================================
-- Todos pueden ver archivos en digital-products (bucket público)
CREATE POLICY "Public can view digital-products files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'digital-products');

-- ============================================================================
-- POLÍTICA 2: INSERCIÓN (UPLOAD)
-- ============================================================================
-- Permitir que profesionales aprobados Y admins puedan subir archivos
CREATE POLICY "Authenticated users can upload to digital-products"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'digital-products'
  AND (
    -- Permitir si el usuario es un profesional aprobado
    EXISTS (
      SELECT 1 FROM public.professional_applications
      WHERE professional_applications.user_id = auth.uid()
      AND professional_applications.status = 'approved'
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
-- POLÍTICA 3: ACTUALIZACIÓN (UPDATE)
-- ============================================================================
-- Profesionales pueden actualizar archivos de sus productos, admins pueden actualizar cualquier archivo
CREATE POLICY "Professionals can update their own digital-products files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'digital-products'
  AND (
    -- Permitir si el archivo pertenece a un producto del profesional
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM digital_products
      WHERE EXISTS (
        SELECT 1 FROM professional_applications
        WHERE professional_applications.id = digital_products.professional_id
        AND professional_applications.user_id = auth.uid()
      )
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
  bucket_id = 'digital-products'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM digital_products
      WHERE EXISTS (
        SELECT 1 FROM professional_applications
        WHERE professional_applications.id = digital_products.professional_id
        AND professional_applications.user_id = auth.uid()
      )
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
-- Profesionales pueden eliminar archivos de sus productos, admins pueden eliminar cualquier archivo
CREATE POLICY "Professionals can delete their own digital-products files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'digital-products'
  AND (
    -- Permitir si el archivo pertenece a un producto del profesional
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM digital_products
      WHERE EXISTS (
        SELECT 1 FROM professional_applications
        WHERE professional_applications.id = digital_products.professional_id
        AND professional_applications.user_id = auth.uid()
      )
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
CREATE POLICY "Admins can manage digital-products files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'digital-products'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
)
WITH CHECK (
  bucket_id = 'digital-products'
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
  AND policyname LIKE '%digital-products%'
ORDER BY policyname, cmd;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Public can view digital-products files" ON storage.objects IS
'Permite que cualquier usuario (incluso anónimos) pueda ver archivos del bucket digital-products';

COMMENT ON POLICY "Authenticated users can upload to digital-products" ON storage.objects IS
'Permite que profesionales aprobados y admins activos puedan subir archivos al bucket digital-products';

COMMENT ON POLICY "Professionals can update their own digital-products files" ON storage.objects IS
'Permite que profesionales actualicen archivos de sus propios productos digitales, y admins pueden actualizar cualquier archivo';

COMMENT ON POLICY "Professionals can delete their own digital-products files" ON storage.objects IS
'Permite que profesionales eliminen archivos de sus propios productos digitales, y admins pueden eliminar cualquier archivo';

COMMENT ON POLICY "Admins can manage digital-products files" ON storage.objects IS
'Política adicional que asegura que administradores activos tengan acceso completo a todos los archivos del bucket digital-products';
