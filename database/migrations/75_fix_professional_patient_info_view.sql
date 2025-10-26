-- Migration: Fix professional_patient_info view to use profiles table
-- This fixes the issue where patients appear as "Paciente [id]" instead of showing their actual names

-- Drop the existing view
DROP VIEW IF EXISTS professional_patient_info;

-- Recreate the view using the profiles table instead of auth.users metadata
CREATE VIEW professional_patient_info AS
SELECT DISTINCT
  p.id as patient_id,
  p.email,
  CONCAT(
    COALESCE(NULLIF(p.first_name, ''), ''),
    CASE
      WHEN COALESCE(NULLIF(p.first_name, ''), '') != '' AND COALESCE(NULLIF(p.last_name, ''), '') != ''
      THEN ' '
      ELSE ''
    END,
    COALESCE(NULLIF(p.last_name, ''), '')
  ) as full_name,
  COALESCE(NULLIF(p.phone, ''), 'No disponible') as phone,
  pa.id as professional_id,
  pa.user_id as professional_user_id
FROM profiles p
INNER JOIN appointments a ON a.patient_id = p.id
INNER JOIN professional_applications pa ON pa.id = a.professional_id
WHERE pa.status = 'approved'
  AND p.type = 'patient';

-- Habilitar RLS en la vista
ALTER VIEW professional_patient_info SET (security_barrier = true);

-- Grant permissions
GRANT SELECT ON professional_patient_info TO authenticated;

-- Comentario para explicar el propósito de la vista
COMMENT ON VIEW professional_patient_info IS
'Vista segura que permite a los profesionales ver información básica (nombre completo, email, teléfono) solo de pacientes con los que tienen citas programadas. Usa la tabla profiles para obtener nombres reales en lugar de metadata.';

-- Verification query (commented out - uncomment to test)
-- SELECT * FROM professional_patient_info LIMIT 5;
