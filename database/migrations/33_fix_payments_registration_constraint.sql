-- Fix payments table constraint to support registration payments
-- The current constraint only allows 'appointment' and 'event' payment types
-- We need to add support for 'registration' payment type

-- First, update the payment_type check constraint to include 'registration'
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_payment_type_check;

ALTER TABLE public.payments
ADD CONSTRAINT payments_payment_type_check
CHECK (payment_type IN ('appointment', 'event', 'registration'));

-- Second, update the appointment_or_event_check constraint to allow registration payments
-- Registration payments won't have appointment_id or event_id, but will have professional_application_id
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_appointment_or_event_check;

ALTER TABLE public.payments
ADD CONSTRAINT payments_appointment_or_event_check
CHECK (
  (payment_type = 'appointment' AND appointment_id IS NOT NULL AND event_id IS NULL) OR
  (payment_type = 'event' AND event_id IS NOT NULL AND appointment_id IS NULL) OR
  (payment_type = 'registration' AND appointment_id IS NULL AND event_id IS NULL AND professional_application_id IS NOT NULL)
);

-- Add index for registration-related queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_payments_professional_application_id ON public.payments(professional_application_id);

-- Comment for clarity
COMMENT ON CONSTRAINT payments_appointment_or_event_check ON public.payments IS
'Ensures that each payment has the correct reference based on its type: appointment_id for appointments, event_id for events, or professional_application_id for registrations';
