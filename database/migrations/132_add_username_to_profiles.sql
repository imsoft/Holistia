-- Script para agregar columna username a profiles
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Agregar columna username a la tabla profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Crear índice único para username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON profiles(username);

-- 3. Agregar restricción para formato de username
-- (lowercase, 3-30 caracteres, solo letras, números, guiones y guiones bajos)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS username_format;

ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR (
    username = LOWER(username) AND
    username ~ '^[a-z0-9_-]+$' AND
    LENGTH(username) >= 3 AND
    LENGTH(username) <= 30
  )
);

-- 4. Comentario explicativo
COMMENT ON COLUMN profiles.username IS 'Nombre de usuario único, debe ser lowercase, 3-30 caracteres, solo letras, números, guiones y guiones bajos';

-- 5. Verificar que la columna fue creada correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'username';
