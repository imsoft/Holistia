-- Agregar campos para desactivación de cuentas en la tabla profiles
-- Migración: 39_add_account_deactivation_fields

-- Agregar campo is_active a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Agregar campo deactivated_at a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Crear índice para búsquedas eficientes de cuentas activas
CREATE INDEX IF NOT EXISTS idx_profiles_is_active 
ON public.profiles(is_active);

-- Comentarios para documentación
COMMENT ON COLUMN public.profiles.is_active IS 'Indica si la cuenta del usuario está activa';
COMMENT ON COLUMN public.profiles.deactivated_at IS 'Fecha y hora en que se desactivó la cuenta';

