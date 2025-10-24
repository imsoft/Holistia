-- Migración para agregar políticas RLS faltantes para que profesionales puedan ver sus citas
-- Fecha: 2025-10-24
-- 
-- PROBLEMA: Los profesionales no pueden ver sus citas porque faltan las políticas RLS
-- SOLUCIÓN: 
--   1. Agregar las políticas necesarias para que los profesionales puedan ver y actualizar sus citas
--   2. Crear una vista segura para que los profesionales puedan ver información básica de sus pacientes

-- ============================================================================
-- PARTE 1: Políticas RLS para appointments
-- ============================================================================

-- Eliminar las políticas si ya existen (por si acaso)
DROP POLICY IF EXISTS "Professionals can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Professionals can update their appointments" ON appointments;

-- Crear política para que los profesionales puedan ver las citas con ellos
CREATE POLICY "Professionals can view their appointments" 
ON appointments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM professional_applications 
    WHERE professional_applications.id = appointments.professional_id 
    AND professional_applications.user_id = auth.uid()
    AND professional_applications.status = 'approved'
  )
);

-- Crear política para que los profesionales puedan actualizar el estado de sus citas
CREATE POLICY "Professionals can update their appointments" 
ON appointments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM professional_applications 
    WHERE professional_applications.id = appointments.professional_id 
    AND professional_applications.user_id = auth.uid()
    AND professional_applications.status = 'approved'
  )
);

-- ============================================================================
-- PARTE 2: Vista para información de pacientes
-- ============================================================================

-- Crear vista para que los profesionales vean info básica de pacientes
-- Solo pueden ver pacientes con los que tienen citas programadas
DROP VIEW IF EXISTS professional_patient_info;

CREATE VIEW professional_patient_info AS
SELECT DISTINCT
  au.id as patient_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'nombre', 'Paciente') as full_name,
  COALESCE(au.raw_user_meta_data->>'phone', au.raw_user_meta_data->>'telefono', 'No disponible') as phone,
  pa.id as professional_id,
  pa.user_id as professional_user_id
FROM auth.users au
INNER JOIN appointments a ON a.patient_id = au.id
INNER JOIN professional_applications pa ON pa.id = a.professional_id
WHERE pa.status = 'approved';

-- Habilitar RLS en la vista
ALTER VIEW professional_patient_info SET (security_barrier = true);

-- Comentario para explicar el propósito de la vista
COMMENT ON VIEW professional_patient_info IS 
'Vista segura que permite a los profesionales ver información básica (nombre, email, teléfono) solo de pacientes con los que tienen citas programadas';

-- Nota: Las vistas heredan las políticas RLS de las tablas subyacentes,
-- por lo que solo los profesionales autenticados podrán ver sus propios pacientes

