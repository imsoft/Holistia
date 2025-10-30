-- Update payments table to support event payments

-- Add new columns for event support
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events_workshops(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS event_registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'appointment' CHECK (payment_type IN ('appointment', 'event'));

-- Make appointment_id nullable since events won't have appointments
ALTER TABLE public.payments 
ALTER COLUMN appointment_id DROP NOT NULL;

-- Make professional_id nullable since events might not have a professional assigned
ALTER TABLE public.payments 
ALTER COLUMN professional_id DROP NOT NULL;

-- Update commission percentage to support different rates
-- Events will use 20%, appointments will continue using 15%
ALTER TABLE public.payments 
ALTER COLUMN commission_percentage DROP DEFAULT;

-- Add constraint to ensure either appointment_id or event_id is provided
ALTER TABLE public.payments 
ADD CONSTRAINT payments_appointment_or_event_check 
CHECK (
  (payment_type = 'appointment' AND appointment_id IS NOT NULL AND event_id IS NULL) OR
  (payment_type = 'event' AND event_id IS NOT NULL AND appointment_id IS NULL)
);

-- Create index for event-related queries
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_registration_id ON public.payments(event_registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);

-- Update RLS policies to include event payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'type' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
CREATE POLICY "Admins can update all payments" ON public.payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'type' = 'admin'
    )
  );

-- Add policy for professionals to view payments for their events
CREATE POLICY "Professionals can view payments for their events" ON public.payments
  FOR SELECT USING (
    payment_type = 'event' AND
    EXISTS (
      SELECT 1 FROM public.events_workshops ew
      JOIN public.professional_applications pa ON pa.id = ew.professional_id
      WHERE ew.id = payments.event_id
      AND pa.user_id = auth.uid()
    )
  );
