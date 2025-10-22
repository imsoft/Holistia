-- Migration: Clean orphan appointments
-- Description: Elimina citas que tienen professional_id que no existen en professional_applications
-- Created: 2025-10-22

-- Eliminar citas huérfanas (donde el professional_id no existe en professional_applications.user_id)
DELETE FROM public.appointments
WHERE professional_id NOT IN (
  SELECT user_id FROM public.professional_applications
);

-- Comentario: Esta migración limpia datos inconsistentes donde las citas
-- están vinculadas a professional_id que no existen en el sistema.

