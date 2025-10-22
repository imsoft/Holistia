-- Migration: Grant first year registration to existing professionals
-- Description: Perdona el primer año de inscripción a profesionales ya registrados
-- Created: 2025-10-22

-- Actualizar todos los profesionales aprobados existentes
-- para que tengan el primer año de inscripción pagado
UPDATE public.professional_applications
SET 
  registration_fee_paid = TRUE,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn'
WHERE 
  status = 'approved'
  AND registration_fee_paid IS NOT TRUE;

-- Comentario: Esta migración otorga el primer año de inscripción gratuito
-- a todos los profesionales que ya estaban aprobados en el sistema.
-- La fecha de expiración se establece en 1 año desde ahora, momento en el cual
-- deberán renovar su inscripción pagando los $1,000 MXN anuales.

