-- Migración: Actualizar cuota de inscripción de $299 a $888 MXN
-- Fecha: 2025-01-XX
-- Descripción: Cambiar el monto de la cuota de inscripción de profesionales de $299.00 a $888.00 MXN

-- Actualizar el valor por defecto de registration_fee_amount
ALTER TABLE professional_applications
ALTER COLUMN registration_fee_amount SET DEFAULT 888.00;

-- Actualizar los comentarios de los campos
COMMENT ON COLUMN professional_applications.registration_fee_paid IS 'Indica si el profesional ha pagado la cuota de inscripción de $888 MXN';
COMMENT ON COLUMN professional_applications.registration_fee_amount IS 'Monto de la cuota de inscripción (por defecto $888 MXN)';

-- NOTA: Los registros existentes mantendrán su monto actual ($299, $600 o el que tengan)
-- Solo los nuevos registros usarán el nuevo valor por defecto de $888
-- Si necesitas actualizar registros existentes, ejecuta:
-- UPDATE professional_applications SET registration_fee_amount = 888.00 WHERE registration_fee_amount != 888.00;
