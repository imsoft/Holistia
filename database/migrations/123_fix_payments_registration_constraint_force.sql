-- Fix payments table constraint to support registration payments
-- This migration ensures that registration payments can be created without appointment_id or event_id
-- Migration 33 should have fixed this, but this ensures it's applied correctly

-- First, update the payment_type check constraint to include 'registration' if not already
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_payment_type_check' 
    AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_payment_type_check;
  END IF;
END $$;

ALTER TABLE public.payments
ADD CONSTRAINT payments_payment_type_check
CHECK (payment_type IN ('appointment', 'event', 'registration'));

-- Second, update the appointment_or_event_check constraint to allow registration payments
-- Registration payments won't have appointment_id or event_id, but will have professional_application_id
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_appointment_or_event_check' 
    AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_appointment_or_event_check;
  END IF;
END $$;

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

