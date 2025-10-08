-- =====================================================
-- SOLUCIÓN FINAL: Sin errores de políticas existentes
-- =====================================================
-- Copia y pega este SQL completo en Supabase SQL Editor

-- PASO 1: Actualizar usuario admin (si no está actualizado)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- PASO 2: Crear bucket (ignora si ya existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view event images" ON storage.objects;

-- PASO 4: Crear políticas nuevas
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

CREATE POLICY "Authenticated users can view event images" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'event-gallery');

-- PASO 5: Verificar que todo funcionó
SELECT '✅ Usuario actualizado:' as status, email, raw_user_meta_data->>'type' as tipo
FROM auth.users WHERE email = 'holistia.io@gmail.com';

SELECT '✅ Bucket creado:' as status, id, name, public 
FROM storage.buckets WHERE id = 'event-gallery';

SELECT '✅ Políticas creadas:' as status, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%event images%'
ORDER BY policyname;
