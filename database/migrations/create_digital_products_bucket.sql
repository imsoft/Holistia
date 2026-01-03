-- Migración: Crear políticas de storage para digital-products
-- Este bucket almacenará las imágenes de portada y archivos de productos digitales

-- ============================================================================
-- INSTRUCCIONES PARA CREAR EL BUCKET (DESDE DASHBOARD)
-- ============================================================================
-- IMPORTANTE: Antes de ejecutar este script, crea el bucket desde el Dashboard de Supabase:
--
-- 1. Ve a Storage en el dashboard de Supabase
-- 2. Haz clic en "New bucket"
-- 3. Nombre: digital-products
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
DROP POLICY IF EXISTS "Authenticated users can upload to digital-products" ON storage.objects;
DROP POLICY IF EXISTS "Public can view digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can delete their own digital-products files" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can update their own digital-products files" ON storage.objects;

-- Política de LECTURA: Todos pueden ver archivos en digital-products (bucket público)
CREATE POLICY "Public can view digital-products files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'digital-products');

-- Política de INSERCIÓN: Solo usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload to digital-products"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'digital-products'
    AND (storage.foldername(name))[1] IN (
        -- Permitir subir en carpetas con UUID (product_id)
        SELECT id::text FROM digital_products
        WHERE EXISTS (
            SELECT 1 FROM professional_applications
            WHERE professional_applications.id = digital_products.professional_id
            AND professional_applications.user_id = auth.uid()
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
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM digital_products
        WHERE EXISTS (
            SELECT 1 FROM professional_applications
            WHERE professional_applications.id = digital_products.professional_id
            AND professional_applications.user_id = auth.uid()
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
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM digital_products
        WHERE EXISTS (
            SELECT 1 FROM professional_applications
            WHERE professional_applications.id = digital_products.professional_id
            AND professional_applications.user_id = auth.uid()
        )
    )
);

-- ============================================================================
-- 3. COMENTARIOS
-- ============================================================================

-- Nota: No se pueden agregar comentarios a las tablas de storage sin permisos de propietario
-- Los buckets deben crearse desde el Dashboard de Supabase
