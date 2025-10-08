-- =====================================================
-- SOLUCIÓN COMPLETA: Configurar Eventos y Storage
-- =====================================================
-- Ejecutar este SQL en Supabase SQL Editor

-- 1. ACTUALIZAR METADATOS DEL USUARIO ADMIN
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- 2. CREAR BUCKET PARA GALERÍA DE EVENTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 3. ELIMINAR POLÍTICAS EXISTENTES SI HAY ALGUNAS
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view event images" ON storage.objects;

-- 4. CREAR NUEVAS POLÍTICAS RLS PARA STORAGE

-- Política para que los administradores puedan subir imágenes
CREATE POLICY "Admins can upload event images" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'event-gallery' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    );

-- Política para que los administradores puedan actualizar imágenes
CREATE POLICY "Admins can update event images" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'event-gallery' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    );

-- Política para que los administradores puedan eliminar imágenes
CREATE POLICY "Admins can delete event images" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'event-gallery' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
        )
    );

-- Política para que todos puedan ver las imágenes (públicas)
CREATE POLICY "Public can view event images" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'event-gallery');

-- Política para que usuarios autenticados puedan ver las imágenes
CREATE POLICY "Authenticated users can view event images" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'event-gallery');

-- 5. VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE
SELECT 'Usuario admin actualizado:' as status, id, email, raw_user_meta_data->>'type' as user_type 
FROM auth.users 
WHERE email = 'holistia.io@gmail.com';

SELECT 'Bucket creado:' as status, * FROM storage.buckets WHERE id = 'event-gallery';

SELECT 'Políticas creadas:' as status, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%event images%';
