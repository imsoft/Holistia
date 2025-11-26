-- Migración: Actualizar cuota de inscripción de $600 a $299 MXN
-- Fecha: 2025-11-26
-- Descripción: Cambiar el monto de la cuota de inscripción de profesionales de $600.00 a $299.00 MXN

-- Actualizar el valor por defecto de registration_fee_amount
ALTER TABLE professional_applications
ALTER COLUMN registration_fee_amount SET DEFAULT 299.00;

-- Actualizar los comentarios de los campos
COMMENT ON COLUMN professional_applications.registration_fee_paid IS 'Indica si el profesional ha pagado la cuota de inscripción de $299 MXN';
COMMENT ON COLUMN professional_applications.registration_fee_amount IS 'Monto de la cuota de inscripción (por defecto $299 MXN)';

-- NOTA: Los registros existentes mantendrán su monto actual ($600 o el que tengan)
-- Solo los nuevos registros usarán el nuevo valor por defecto de $299
-- Si necesitas actualizar registros existentes, ejecuta:
-- UPDATE professional_applications SET registration_fee_amount = 299.00 WHERE registration_fee_amount = 600.00;

