-- Agregar campo de estado a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended'));

-- Crear índice para mejorar performance en consultas por estado
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- Actualizar usuarios existentes para que tengan estado activo
UPDATE public.profiles 
SET account_status = 'active' 
WHERE account_status IS NULL;

-- Hacer el campo NOT NULL después de actualizar los valores existentes
ALTER TABLE public.profiles 
ALTER COLUMN account_status SET NOT NULL;

-- Comentario para documentar el campo
COMMENT ON COLUMN public.profiles.account_status IS 'Estado de la cuenta del usuario: active, inactive, suspended';
