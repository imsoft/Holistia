-- Migración: Agregar fecha de expiración para el pago de inscripción anual
-- Fecha: 2025-10-22
-- Descripción: El pago de inscripción de $1,000 MXN es anual y debe renovarse cada año

-- Agregar campo de fecha de expiración
ALTER TABLE professional_applications
ADD COLUMN registration_fee_expires_at TIMESTAMP WITH TIME ZONE;

-- Agregar comentario
COMMENT ON COLUMN professional_applications.registration_fee_expires_at IS 'Fecha de expiración del pago de inscripción anual. Se renueva cada año desde la fecha de pago.';

-- Crear índice para consultas de profesionales con pago vigente
CREATE INDEX idx_professional_applications_registration_expires 
ON professional_applications(registration_fee_expires_at) 
WHERE registration_fee_paid = TRUE;

-- Actualizar registros existentes que ya pagaron para que expiren en 1 año desde la fecha de pago
UPDATE professional_applications
SET registration_fee_expires_at = registration_fee_paid_at + INTERVAL '1 year'
WHERE registration_fee_paid = TRUE 
  AND registration_fee_paid_at IS NOT NULL
  AND registration_fee_expires_at IS NULL;

-- Crear función para verificar si el pago está vigente
CREATE OR REPLACE FUNCTION is_registration_fee_active(
  p_paid BOOLEAN,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_paid = TRUE 
    AND p_expires_at IS NOT NULL 
    AND p_expires_at > NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_registration_fee_active IS 'Verifica si el pago de inscripción está vigente (pagado y no expirado)';

-- Crear función para obtener días hasta la expiración
CREATE OR REPLACE FUNCTION days_until_registration_expires(
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS INTEGER AS $$
BEGIN
  IF p_expires_at IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(DAY FROM (p_expires_at - NOW()))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION days_until_registration_expires IS 'Calcula los días restantes hasta que expire el pago de inscripción';

