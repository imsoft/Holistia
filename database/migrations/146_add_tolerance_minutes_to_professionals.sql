-- Migración 146: Agregar tiempo de tolerancia para profesionales
-- Permite que los profesionales configuren cuántos minutos esperan a sus pacientes
-- Este tiempo se mostrará a los pacientes después de agendar una cita exitosamente

-- ============================================================================
-- 1. AGREGAR CAMPO DE TOLERANCIA
-- ============================================================================

-- Agregar columna tolerance_minutes a professional_applications
-- Valor por defecto: 15 minutos (tiempo estándar de tolerancia)
ALTER TABLE public.professional_applications
ADD COLUMN IF NOT EXISTS tolerance_minutes INTEGER DEFAULT 15;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.professional_applications.tolerance_minutes IS 
'Tiempo de tolerancia en minutos que el profesional espera a sus pacientes antes de considerar la cita como no asistida. Valor por defecto: 15 minutos.';

-- ============================================================================
-- 2. ACTUALIZAR VALORES EXISTENTES
-- ============================================================================

-- Establecer 15 minutos como valor por defecto para profesionales existentes que no tengan el campo
UPDATE public.professional_applications
SET tolerance_minutes = 15
WHERE tolerance_minutes IS NULL;

-- ============================================================================
-- 3. AGREGAR CONSTRAINT
-- ============================================================================

-- Asegurar que el tiempo de tolerancia sea un valor positivo
ALTER TABLE public.professional_applications
ADD CONSTRAINT check_tolerance_minutes_positive 
CHECK (tolerance_minutes IS NULL OR tolerance_minutes >= 0);
