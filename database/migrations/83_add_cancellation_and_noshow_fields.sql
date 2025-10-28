-- ============================================================================
-- MIGRACIÓN 83: Agregar campos para cancelaciones y no-shows
-- ============================================================================
-- Fecha: 27 de octubre de 2025
-- Propósito: Permitir cancelaciones con razones y gestión de no-shows
-- ============================================================================

-- ============================================================================
-- PASO 1: Actualizar constraint de status para incluir nuevos estados
-- ============================================================================

-- Primero eliminar el constraint existente
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Agregar nuevo constraint con estados adicionales
ALTER TABLE appointments
ADD CONSTRAINT appointments_status_check
CHECK (status IN (
  'pending',           -- Cita pendiente de confirmación
  'confirmed',         -- Cita confirmada
  'completed',         -- Cita completada
  'cancelled',         -- Cita cancelada
  'patient_no_show',   -- Paciente no se presentó
  'professional_no_show' -- Profesional no se presentó
));

-- ============================================================================
-- PASO 2: Agregar campos para gestión de cancelaciones
-- ============================================================================

-- Quién canceló la cita (patient o professional)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('patient', 'professional'));

-- Razón de la cancelación (opcional)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Fecha de cancelación
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- ============================================================================
-- PASO 3: Agregar campos para gestión de no-shows
-- ============================================================================

-- Quién marcó el no-show (patient o professional)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS no_show_marked_by TEXT CHECK (no_show_marked_by IN ('patient', 'professional'));

-- Descripción del no-show (opcional)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS no_show_description TEXT;

-- Fecha en que se marcó el no-show
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS no_show_marked_at TIMESTAMPTZ;

-- ============================================================================
-- PASO 4: Agregar campo para bonos de crédito
-- ============================================================================

-- Indica si esta cita genera un bono de crédito para el paciente
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS generates_credit BOOLEAN DEFAULT false;

-- Monto del crédito generado (igual al costo de la cita)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(10,2);

-- ============================================================================
-- PASO 5: Crear tabla para gestionar créditos de pacientes
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  original_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  used_in_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,

  -- Constraint: un crédito no puede estar usado sin fecha de uso
  CONSTRAINT credit_used_check CHECK (
    (status = 'used' AND used_at IS NOT NULL AND used_in_appointment_id IS NOT NULL) OR
    (status != 'used')
  )
);

-- Índices para la tabla de créditos
CREATE INDEX IF NOT EXISTS idx_patient_credits_patient_id ON patient_credits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_credits_professional_id ON patient_credits(professional_id);
CREATE INDEX IF NOT EXISTS idx_patient_credits_status ON patient_credits(status);
CREATE INDEX IF NOT EXISTS idx_patient_credits_original_appointment ON patient_credits(original_appointment_id);

-- Habilitar RLS en patient_credits
ALTER TABLE patient_credits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para patient_credits
CREATE POLICY "Patients can view their own credits"
ON patient_credits
FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Professionals can view credits for their services"
ON patient_credits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM professional_applications
    WHERE professional_applications.id = patient_credits.professional_id
    AND professional_applications.user_id = auth.uid()
    AND professional_applications.status = 'approved'
  )
);

CREATE POLICY "System can insert credits"
ON patient_credits
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update credits"
ON patient_credits
FOR UPDATE
USING (true);

-- ============================================================================
-- PASO 6: Crear índices para los nuevos campos
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_cancelled_by ON appointments(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_appointments_cancelled_at ON appointments(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_no_show_marked_by ON appointments(no_show_marked_by);
CREATE INDEX IF NOT EXISTS idx_appointments_generates_credit ON appointments(generates_credit) WHERE generates_credit = true;

-- ============================================================================
-- PASO 7: Agregar comentarios
-- ============================================================================

COMMENT ON COLUMN appointments.cancelled_by IS
'Indica quién canceló la cita: patient o professional';

COMMENT ON COLUMN appointments.cancellation_reason IS
'Razón opcional proporcionada al cancelar la cita';

COMMENT ON COLUMN appointments.cancelled_at IS
'Fecha y hora en que se canceló la cita';

COMMENT ON COLUMN appointments.no_show_marked_by IS
'Indica quién marcó el no-show: patient o professional';

COMMENT ON COLUMN appointments.no_show_description IS
'Descripción opcional del no-show';

COMMENT ON COLUMN appointments.no_show_marked_at IS
'Fecha y hora en que se marcó el no-show';

COMMENT ON COLUMN appointments.generates_credit IS
'Indica si esta cita cancelada genera un bono de crédito para el paciente';

COMMENT ON COLUMN appointments.credit_amount IS
'Monto del crédito generado por esta cita cancelada';

COMMENT ON TABLE patient_credits IS
'Tabla de créditos de pacientes generados por cancelaciones. Los créditos pueden usarse en futuras citas con el mismo profesional.';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
