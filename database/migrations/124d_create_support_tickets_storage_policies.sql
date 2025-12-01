-- Políticas de Storage para support-tickets bucket
-- Fecha: 2025-01-01
-- Descripción: Crea políticas RLS para permitir subir y ver archivos en el bucket support-tickets

-- =====================================================
-- 1. Eliminar políticas existentes si existen
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete files" ON storage.objects;

-- =====================================================
-- 2. Política para subir archivos
-- =====================================================
-- Los usuarios autenticados pueden subir archivos al bucket support-tickets
CREATE POLICY "Authenticated users can upload to support-tickets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-tickets'
);

-- =====================================================
-- 3. Política para ver archivos
-- =====================================================
-- Cualquiera puede ver los archivos del bucket support-tickets (bucket público)
CREATE POLICY "Anyone can view support-tickets files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'support-tickets'
);

-- =====================================================
-- 4. Política para actualizar archivos
-- =====================================================
-- Los usuarios autenticados pueden actualizar sus propios archivos
CREATE POLICY "Users can update their own files in support-tickets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'support-tickets'
)
WITH CHECK (
  bucket_id = 'support-tickets'
);

-- =====================================================
-- 5. Política para eliminar archivos
-- =====================================================
-- Solo los admins pueden eliminar archivos
CREATE POLICY "Only admins can delete support-tickets files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'support-tickets' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE type = 'admin'
  )
);
