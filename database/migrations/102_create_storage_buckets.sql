-- =====================================================
-- MIGRACIÓN: Crear buckets de Storage para imágenes
-- =====================================================
-- Crea los buckets necesarios para almacenar imágenes de
-- restaurantes y centros holísticos
-- =====================================================

-- 1. Crear bucket para restaurantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurants',
  'restaurants',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear bucket para centros holísticos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'holistic-centers',
  'holistic-centers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de seguridad para restaurantes
-- Eliminar políticas existentes si existen (para permitir re-ejecución)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurants');

-- Permitir subida solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurants');

-- Permitir actualización solo a usuarios autenticados
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurants')
WITH CHECK (bucket_id = 'restaurants');

-- Permitir eliminación solo a usuarios autenticados
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurants');

-- 4. Políticas de seguridad para centros holísticos
-- Eliminar políticas existentes si existen (para permitir re-ejecución)
DROP POLICY IF EXISTS "Public Access Holistic" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload holistic" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update holistic" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete holistic" ON storage.objects;

-- Permitir lectura pública
CREATE POLICY "Public Access Holistic"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'holistic-centers');

-- Permitir subida solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload holistic"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'holistic-centers');

-- Permitir actualización solo a usuarios autenticados
CREATE POLICY "Authenticated users can update holistic"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'holistic-centers')
WITH CHECK (bucket_id = 'holistic-centers');

-- Permitir eliminación solo a usuarios autenticados
CREATE POLICY "Authenticated users can delete holistic"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'holistic-centers');

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO:
-- =====================================================
-- Restaurantes: restaurants/<restaurant-id>/imagen.{ext}
-- Centros: holistic-centers/<center-id>/imagen.{ext}
-- 
-- Ejemplo:
-- - restaurants/abc-123-def/imagen.jpg
-- - holistic-centers/xyz-789-ghi/imagen.png
-- =====================================================
