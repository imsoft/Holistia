-- SQL para solucionar el error de permisos
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Otorgar permiso de SELECT en auth.users al rol authenticated
GRANT SELECT ON auth.users TO authenticated;

-- 2. Verificar que la tabla professional_applications existe y tiene las políticas correctas
-- (Este comando es solo informativo, no es necesario ejecutarlo)
-- SELECT table_name, is_insertable_into FROM information_schema.tables WHERE table_name = 'professional_applications';

-- 3. Si necesitas verificar las políticas RLS existentes:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies WHERE tablename = 'professional_applications';
