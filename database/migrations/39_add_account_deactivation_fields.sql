-- Agregar campos para desactivación de cuentas en la tabla profiles
-- Migración: 39_add_account_deactivation_fields

-- NOTA: La tabla public.profiles ya tiene el campo 'activo' (boolean)
-- Solo necesitamos agregar el campo deactivated_at para tracking

-- Agregar campo deactivated_at a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Crear índice para búsquedas eficientes de cuentas activas (usando el campo existente 'activo')
CREATE INDEX IF NOT EXISTS idx_profiles_activo 
ON public.profiles(activo);

-- Comentarios para documentación
COMMENT ON COLUMN public.profiles.activo IS 'Indica si la cuenta del usuario está activa (campo existente)';
COMMENT ON COLUMN public.profiles.deactivated_at IS 'Fecha y hora en que se desactivó la cuenta';

