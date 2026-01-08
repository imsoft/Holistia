-- ============================================================================
-- MIGRACIÓN 156: Corregir políticas RLS del bucket digital-products
-- ============================================================================
-- Fecha: 2025-12-11
-- Propósito: Permitir que profesionales puedan subir archivos al crear productos
--            sin necesidad de que el producto exista previamente
-- ============================================================================

-- Eliminar políticas existentes que requieren que el producto exista
DROP POLICY IF EXISTS "Authenticated users can upload to digital-products" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can update their own digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can delete their own digital-products files" ON storage.objects;

-- Política de INSERCIÓN: Usuarios autenticados pueden subir archivos
-- Permitir subir en cualquier carpeta (product_id) si el usuario es profesional o admin
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
    -- O si es admin
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  )
);

-- Política de ACTUALIZACIÓN: Profesionales pueden actualizar archivos de sus productos
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
    -- Permitir si el archivo pertenece a un producto del profesional
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

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can upload to digital-products" ON storage.objects IS
'Permite que profesionales aprobados y admins puedan subir archivos al bucket digital-products, incluso antes de crear el producto en la tabla';

COMMENT ON POLICY "Professionals can update their own digital-products files" ON storage.objects IS
'Permite que profesionales actualicen archivos de sus propios productos digitales';

COMMENT ON POLICY "Professionals can delete their own digital-products files" ON storage.objects IS
'Permite que profesionales eliminen archivos de sus propios productos digitales';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

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
-- La política de inserción ahora permite que profesionales aprobados suban
-- archivos sin necesidad de que el producto exista previamente en la tabla.
-- Esto permite el flujo: 1) Subir imagen, 2) Crear producto con la URL de la imagen.
-- ============================================================================
