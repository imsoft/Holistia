-- Migración 135: Crear bucket de storage para imágenes de servicios holísticos
-- Este bucket almacena las imágenes de los servicios holísticos que se ofrecen a empresas

-- 1. Crear bucket para servicios holísticos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'holistic-services',
  'holistic-services',
  true, -- Público para que los clientes puedan ver las imágenes
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de seguridad para el bucket
-- Eliminar políticas existentes si existen (para hacer la migración idempotente)
DROP POLICY IF EXISTS "Public Access Holistic Services" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload holistic services" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update holistic services" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete holistic services" ON storage.objects;

-- Permitir lectura pública (para que los clientes vean las imágenes)
CREATE POLICY "Public Access Holistic Services"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'holistic-services');

-- Permitir subida solo a usuarios autenticados (admins)
CREATE POLICY "Authenticated users can upload holistic services"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'holistic-services');

-- Permitir actualización solo a usuarios autenticados (admins)
CREATE POLICY "Authenticated users can update holistic services"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'holistic-services')
WITH CHECK (bucket_id = 'holistic-services');

-- Permitir eliminación solo a usuarios autenticados (admins)
CREATE POLICY "Authenticated users can delete holistic services"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'holistic-services');

-- =====================================================
-- ESTRUCTURA DE ALMACENAMIENTO:
-- =====================================================
-- holistic-services/<service-id>/image-0.jpg
-- holistic-services/<service-id>/image-1.jpg
-- holistic-services/<service-id>/image-2.jpg
-- holistic-services/<service-id>/image-3.jpg
-- 
-- Ejemplo:
-- holistic-services/abc-123-def/image-0.jpg
-- holistic-services/abc-123-def/image-1.png
-- =====================================================
