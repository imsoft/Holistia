-- Migración 140: Agregar campo is_verified a professional_applications
-- Este campo permitirá a los administradores marcar profesionales como verificados
-- Los profesionales verificados mostrarán una insignia especial junto a su nombre

-- 1. Agregar columna is_verified
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false NOT NULL;

-- 2. Crear índice para mejorar rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_professional_applications_is_verified
ON public.professional_applications(is_verified);

-- 3. Crear índice compuesto para búsquedas por status y verificación
CREATE INDEX IF NOT EXISTS idx_professional_applications_status_verified
ON public.professional_applications(status, is_verified);

-- 4. Comentarios para documentación
COMMENT ON COLUMN public.professional_applications.is_verified IS 'Indica si el profesional ha sido verificado por un administrador. Los profesionales verificados muestran una insignia especial.';

-- 5. Nota: Las políticas RLS existentes para admins ya cubren la capacidad de actualizar este campo
-- No se requieren políticas adicionales, ya que solo los administradores pueden modificar professional_applications
