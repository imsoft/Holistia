-- ============================================================================
-- MIGRACIÓN: Crear tabla password_reset_tokens
-- Descripción: Tabla para almacenar tokens de reseteo de contraseña con Resend
-- ============================================================================

-- Crear tabla para tokens de reseteo de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);

-- Índice para limpiar tokens expirados
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Política RLS: Solo permitir acceso desde el servidor (service role)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No crear políticas de lectura/escritura para usuarios autenticados
-- Solo el service role puede acceder a esta tabla

-- Comentarios para documentación
COMMENT ON TABLE password_reset_tokens IS 'Tokens temporales para reseteo de contraseña via email con Resend';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único generado para el enlace de reseteo';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Fecha de expiración del token (1 hora por defecto)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Fecha en que se usó el token (null si no se ha usado)';
