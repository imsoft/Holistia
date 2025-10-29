-- Arreglar política RLS para que los pacientes puedan ver bloqueos de disponibilidad
-- La política actual es demasiado restrictiva

-- Eliminar la política existente
DROP POLICY IF EXISTS "Patients can view availability blocks" ON availability_blocks;

-- Crear nueva política más permisiva para que cualquier usuario autenticado pueda ver bloqueos
-- de profesionales aprobados (esto es necesario para que los pacientes puedan ver la disponibilidad)
CREATE POLICY "Authenticated users can view availability blocks of approved professionals"
ON availability_blocks FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND professional_id IN (
    SELECT id FROM professional_applications 
    WHERE status = 'approved'
  )
);

-- También permitir que los profesionales vean sus propios bloqueos (por si acaso)
CREATE POLICY "Professionals can view their own availability blocks"
ON availability_blocks FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM professional_applications 
    WHERE user_id = auth.uid()
  )
);

-- Comentario explicativo
COMMENT ON POLICY "Authenticated users can view availability blocks of approved professionals" 
ON availability_blocks IS 'Permite a cualquier usuario autenticado ver los bloqueos de disponibilidad de profesionales aprobados para verificar disponibilidad al agendar citas';
