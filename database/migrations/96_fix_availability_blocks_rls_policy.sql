-- Arreglar política RLS para que los pacientes puedan ver bloqueos de disponibilidad
-- La tabla availability_blocks no tiene foreign key a professional_applications,
-- solo tiene professional_id como UUID directo

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Patients can view availability blocks" ON availability_blocks;
DROP POLICY IF EXISTS "Professionals can manage their own availability blocks" ON availability_blocks;

-- Crear política simple: cualquier usuario autenticado puede ver bloqueos
-- Esto es necesario para que los pacientes puedan ver la disponibilidad al agendar
CREATE POLICY "Authenticated users can view availability blocks"
ON availability_blocks FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Los profesionales pueden gestionar sus propios bloqueos
CREATE POLICY "Professionals can manage their own availability blocks"
ON availability_blocks FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Comentario explicativo
COMMENT ON POLICY "Authenticated users can view availability blocks" 
ON availability_blocks IS 'Permite a cualquier usuario autenticado ver los bloqueos de disponibilidad para verificar disponibilidad al agendar citas';
