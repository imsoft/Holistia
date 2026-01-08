-- ============================================================================
-- MIGRACIÓN 155: Crear bucket de storage para productos digitales
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Crear el bucket digital-products para almacenar imágenes y archivos
-- ============================================================================

-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products',
  true, -- Bucket público para que las imágenes sean accesibles
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
    'application/zip',
    'application/x-zip-compressed'
  ];

-- ============================================================================
-- POLÍTICAS DE STORAGE
-- ============================================================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Public can view digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to digital-products" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can update their own digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can delete their own digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage digital-products files" ON storage.objects;

-- Política de LECTURA: Todos pueden ver archivos en digital-products (bucket público)
CREATE POLICY "Public can view digital-products files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'digital-products');

-- Política de INSERCIÓN: Usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload to digital-products"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'digital-products');

-- Política de ACTUALIZACIÓN: Profesionales pueden actualizar archivos de sus productos
CREATE POLICY "Professionals can update their own digital-products files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'digital-products'
  AND (
    -- Permitir si el usuario es el profesional dueño del producto
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM digital_products
      WHERE EXISTS (
        SELECT 1 FROM professional_applications
        WHERE professional_applications.id = digital_products.professional_id
        AND professional_applications.user_id = auth.uid()
      )
    )
    -- O si es admin
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
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  )
);

-- Política de ELIMINACIÓN: Profesionales pueden eliminar archivos de sus productos
CREATE POLICY "Professionals can delete their own digital-products files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
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
    -- O si es admin
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  )
);

-- Política para ADMINS: Pueden gestionar todos los archivos
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
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Public can view digital-products files" ON storage.objects IS
'Permite que cualquier usuario (incluso anónimos) pueda ver archivos del bucket digital-products';

COMMENT ON POLICY "Authenticated users can upload to digital-products" ON storage.objects IS
'Permite que usuarios autenticados puedan subir archivos al bucket digital-products';

COMMENT ON POLICY "Professionals can update their own digital-products files" ON storage.objects IS
'Permite que profesionales actualicen archivos de sus propios productos digitales';

COMMENT ON POLICY "Professionals can delete their own digital-products files" ON storage.objects IS
'Permite que profesionales eliminen archivos de sus propios productos digitales';

COMMENT ON POLICY "Admins can manage digital-products files" ON storage.objects IS
'Permite que administradores gestionen todos los archivos del bucket digital-products';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que el bucket se creó correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'digital-products';

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%digital-products%'
ORDER BY policyname;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- Este script crea el bucket digital-products y sus políticas RLS.
-- El bucket es público para que las imágenes sean accesibles sin autenticación.
-- Los profesionales solo pueden gestionar archivos de sus propios productos.
-- Los administradores pueden gestionar todos los archivos.
-- ============================================================================
