-- ============================================================================
-- MIGRACIÓN 177: Corregir vista challenges_with_professional para solo mostrar retos creados por profesionales
-- ============================================================================
-- Fecha: 2026-01-XX
-- Propósito:
--   - Asegurar que solo se muestren retos creados por profesionales (no usuarios normales)
--   - Excluir retos creados por profesionales cuando actuaron como usuarios normales
--   - Solo mostrar retos donde created_by_type = 'professional' y professional_id IS NOT NULL
-- ============================================================================

-- Eliminar la vista existente
DROP VIEW IF EXISTS public.challenges_with_professional;

-- Recrear la vista con filtrado correcto
CREATE VIEW public.challenges_with_professional AS
SELECT
    c.id,
    c.professional_id,
    c.created_by_user_id,
    c.created_by_type,
    c.linked_patient_id,
    c.linked_professional_id,
    c.title,
    c.description,
    c.short_description,
    c.cover_image_url,
    c.duration_days,
    c.difficulty_level,
    c.category,
    c.wellness_areas,
    c.price,
    c.currency,
    c.is_active,
    c.created_at,
    c.updated_at,
    -- Información del profesional creador (si existe)
    pa.first_name as professional_first_name,
    pa.last_name as professional_last_name,
    pa.profile_photo as professional_photo,
    pa.profession as professional_profession,
    pa.is_verified as professional_is_verified,
    -- Información del profesional vinculado (si existe)
    linked_pa.first_name as linked_professional_first_name,
    linked_pa.last_name as linked_professional_last_name,
    linked_pa.profile_photo as linked_professional_photo,
    linked_pa.profession as linked_professional_profession,
    linked_pa.is_verified as linked_professional_is_verified
FROM public.challenges c
INNER JOIN public.professional_applications pa ON c.professional_id = pa.id
LEFT JOIN public.professional_applications linked_pa ON c.linked_professional_id = linked_pa.id
WHERE c.is_active = true
AND c.professional_id IS NOT NULL
AND c.created_by_type = 'professional'
AND pa.status = 'approved'
AND pa.is_active = true;

COMMENT ON VIEW public.challenges_with_professional IS 'Vista de retos activos creados únicamente por profesionales (no usuarios normales) con información del profesional creador y vinculado';

-- ============================================================================
-- END OF MIGRATION 177
-- ============================================================================
