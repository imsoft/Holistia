-- Permitir que usuarios autenticados lean servicios de profesionales aprobados
-- Esta política permite que los pacientes puedan ver los servicios de profesionales aprobados

CREATE POLICY "Patients can read approved professional services" ON public.professional_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.professional_applications pa 
    WHERE pa.id = professional_services.professional_id 
    AND pa.status = 'approved'
  )
);

-- Comentario: Esta política es necesaria para que los pacientes puedan ver
-- los servicios disponibles de los profesionales en la página de perfil
-- y en el diálogo de reservas de citas.
