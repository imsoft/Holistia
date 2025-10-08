-- =====================================================
-- EJECUTAR MANUALMENTE EN SUPABASE SQL EDITOR
-- =====================================================

-- Actualizar usuario admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- Crear bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar que todo se creó
SELECT 'Usuario actualizado:' as status, email, raw_user_meta_data->>'type' as tipo
FROM auth.users WHERE email = 'holistia.io@gmail.com';

SELECT 'Bucket creado:' as status, id, name, public 
FROM storage.buckets WHERE id = 'event-gallery';
