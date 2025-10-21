-- Migración: Agregar columna is_active a professional_applications
-- Permite a los administradores activar/desactivar profesionales en el listado público

-- 1. Agregar columna is_active
ALTER TABLE professional_applications
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Crear índice para mejorar consultas de filtrado
CREATE INDEX IF NOT EXISTS idx_professional_applications_is_active
ON professional_applications(is_active);

-- 3. Crear índice compuesto para consultas de profesionales activos y aprobados
CREATE INDEX IF NOT EXISTS idx_professional_applications_active_approved
ON professional_applications(status, is_active)
WHERE status = 'approved' AND is_active = true;

-- 4. Comentarios para documentación
COMMENT ON COLUMN professional_applications.is_active IS
'Indica si el profesional está activo y visible en el listado público. Los administradores pueden cambiar este valor.';
