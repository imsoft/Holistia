-- =====================================================
-- ACTUALIZAR USUARIO A ADMIN
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- Actualizar usuario a admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- Verificar que se actualizó
SELECT 'Usuario actualizado:' as status, email, raw_user_meta_data->>'type' as user_type
FROM auth.users WHERE email = 'holistia.io@gmail.com';
