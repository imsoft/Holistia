-- =====================================================
-- SOLUCIÓN DIRECTA: Aplicar migraciones paso a paso
-- =====================================================
-- Copia y pega este SQL completo en Supabase SQL Editor

-- PASO 1: Actualizar usuario admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- PASO 2: Crear bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Crear políticas de storage
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

CREATE POLICY "Public can view event images" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'event-gallery');

-- PASO 4: Verificar que todo funcionó
SELECT 'Usuario actualizado:' as paso, email, raw_user_meta_data->>'type' as tipo
FROM auth.users WHERE email = 'holistia.io@gmail.com';

SELECT 'Bucket creado:' as paso, id, name, public 
FROM storage.buckets WHERE id = 'event-gallery';
