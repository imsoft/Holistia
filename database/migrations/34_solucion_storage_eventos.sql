-- =====================================================
-- SOLUCIÓN: Configurar Storage para Eventos
-- =====================================================
-- Ejecutar este SQL en Supabase SQL Editor

-- 1. CREAR BUCKET PARA GALERÍA DE EVENTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. ELIMINAR POLÍTICAS EXISTENTES SI HAY ALGUNAS (por seguridad)
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view event images" ON storage.objects;

-- 3. CREAR NUEVAS POLÍTICAS RLS PARA STORAGE

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

-- 4. VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE
SELECT 'Bucket creado:' as status, * FROM storage.buckets WHERE id = 'event-gallery';

-- 5. VERIFICAR POLÍTICAS CREADAS
SELECT 'Políticas creadas:' as status, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%event images%';
