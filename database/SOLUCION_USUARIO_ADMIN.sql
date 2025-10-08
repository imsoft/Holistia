-- =====================================================
-- SOLUCIONAR ERROR 403 - USUARIO ADMIN
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar usuario a admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- 2. Crear políticas RLS para el bucket event-gallery
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

CREATE POLICY "Public can view event images" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'event-gallery');

-- 3. Verificar que todo se aplicó
SELECT 'Usuario:' as tipo, email, raw_user_meta_data->>'type' as user_type
FROM auth.users WHERE email = 'holistia.io@gmail.com';

SELECT 'Políticas:' as tipo, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%event images%';
