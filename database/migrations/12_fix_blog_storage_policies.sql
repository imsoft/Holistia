-- Fix blog-images storage policies to allow authenticated users
-- This fixes the "new row violates row-level security policy" error

-- Eliminar políticas existentes para blog-images
DROP POLICY IF EXISTS "Anyone can read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete blog images" ON storage.objects;

-- Crear políticas más flexibles para blog-images bucket

-- Policy: Cualquier usuario autenticado puede leer imágenes del blog
CREATE POLICY "Authenticated users can read blog images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'blog-images');

-- Policy: Cualquier usuario autenticado puede subir imágenes del blog
CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

-- Policy: Cualquier usuario autenticado puede actualizar imágenes del blog
CREATE POLICY "Authenticated users can update blog images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');

-- Policy: Cualquier usuario autenticado puede eliminar imágenes del blog
CREATE POLICY "Authenticated users can delete blog images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images');

-- También asegurar que el bucket existe (esto debería hacerse manualmente en Supabase Dashboard)
-- Si el bucket no existe, créalo manualmente en Storage > Create bucket
-- Nombre: blog-images
-- Public: false (privado)
-- File size limit: 50MB
-- Allowed MIME types: image/*
