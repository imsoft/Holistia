-- ============================================================================
-- MIGRACIÓN: Añadir campo account_active a profiles
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Permitir desactivación de cuentas desde la tabla profiles
-- ============================================================================

-- Añadir columna account_active (por defecto true)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_active BOOLEAN DEFAULT true NOT NULL;

-- Añadir columna deactivated_at para rastrear cuándo se desactivó
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Crear índice para búsquedas de cuentas activas
CREATE INDEX IF NOT EXISTS idx_profiles_account_active 
ON profiles(account_active) 
WHERE account_active = false;

-- Comentarios
COMMENT ON COLUMN profiles.account_active IS 
'Indica si la cuenta está activa. False = cuenta desactivada por el usuario.';

COMMENT ON COLUMN profiles.deactivated_at IS 
'Timestamp de cuándo se desactivó la cuenta. NULL = cuenta nunca desactivada.';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  '✅ COLUMNAS AÑADIDAS' as estado,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name IN ('account_active', 'deactivated_at')
ORDER BY column_name;

-- Verificar índice creado
SELECT 
  '✅ ÍNDICE CREADO' as estado,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname = 'idx_profiles_account_active';

