-- Agregar columna username a la tabla profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Crear índice para búsquedas rápidas por username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Agregar restricción para asegurar que username sea lowercase y sin espacios
ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR (
    username = LOWER(username) AND
    username ~ '^[a-z0-9_-]+$' AND
    LENGTH(username) >= 3 AND
    LENGTH(username) <= 30
  )
);

-- Comentario explicativo
COMMENT ON COLUMN profiles.username IS 'Nombre de usuario único, debe ser lowercase, 3-30 caracteres, solo letras, números, guiones y guiones bajos';
