-- ============================================================================
-- MIGRACIÓN 175: Agregar campo is_public a challenges
-- Descripción: Agrega campo is_public para controlar visibilidad pública/privada de retos
-- Fecha: 2025-01-XX
-- ============================================================================

-- Agregar campo is_public a la tabla challenges
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL;

-- Crear índice para búsquedas de retos públicos
CREATE INDEX IF NOT EXISTS idx_challenges_is_public ON public.challenges(is_public) WHERE is_public = true;

-- Comentario del campo
COMMENT ON COLUMN public.challenges.is_public IS 'Si el reto es público (visible para todos) o privado (solo visible para el creador e invitados). Por defecto false (privado)';

-- Actualizar retos existentes: los retos de profesionales que están activos serán públicos por defecto
-- Los retos de pacientes seguirán siendo privados
UPDATE public.challenges
SET is_public = true
WHERE is_active = true 
  AND created_by_type = 'professional';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 
-- REGLAS DE VISIBILIDAD:
-- 1. Retos creados por PROFESIONALES:
--    - is_public = true: visible públicamente en exploración
--    - is_public = false: privado (solo para pacientes asignados)
--
-- 2. Retos creados por PACIENTES:
--    - is_public = true: visible públicamente en exploración
--    - is_public = false: privado (solo para el creador e invitados al equipo)
--
-- 3. is_active vs is_public:
--    - is_active: controla si el reto está activo o inactivo
--    - is_public: controla si el reto es público o privado
--    - Un reto puede estar activo pero privado (is_active = true, is_public = false)
--    - Un reto puede estar inactivo pero público (is_active = false, is_public = true)
--
-- 4. Actualización de políticas RLS:
--    - Las políticas RLS existentes ya manejan is_active = true como públicos
--    - Necesitamos actualizar las políticas para usar is_public en lugar de is_active
--    - Esto se hará en una migración posterior si es necesario
