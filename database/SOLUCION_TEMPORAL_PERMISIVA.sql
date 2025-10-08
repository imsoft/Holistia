-- =====================================================
-- SOLUCIÓN TEMPORAL - POLÍTICAS MÁS PERMISIVAS
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. ACTUALIZAR USUARIO A ADMIN
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- 2. CREAR BUCKET SI NO EXISTE
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 3. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for event-gallery" ON storage.objects;

-- 4. CREAR POLÍTICA TEMPORAL MUY PERMISIVA
CREATE POLICY "Allow all for event-gallery" ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'event-gallery')
    WITH CHECK (bucket_id = 'event-gallery');

-- 5. POLÍTICA PARA USUARIOS NO AUTENTICADOS (solo lectura)
CREATE POLICY "Public can view event images" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'event-gallery');

-- 6. VERIFICAR TODO
SELECT 'Usuario:' as tipo, email, raw_user_meta_data->>'type' as user_type
FROM auth.users WHERE email = 'holistia.io@gmail.com';

SELECT 'Bucket:' as tipo, id, name, public 
FROM storage.buckets WHERE id = 'event-gallery';

SELECT 'Políticas:' as tipo, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%event images%' OR policyname LIKE '%event-gallery%')
ORDER BY policyname;
