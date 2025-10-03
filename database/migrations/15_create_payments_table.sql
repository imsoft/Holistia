-- Create payments table for Stripe transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship with appointment
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  -- Stripe information
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL, -- Total amount charged (15% commission)
  service_amount DECIMAL(10, 2) NOT NULL, -- Original service amount (100%)
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
  currency TEXT NOT NULL DEFAULT 'mxn',
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Possible statuses: pending, processing, succeeded, failed, refunded, cancelled
  
  -- User information
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
  
  -- Metadata
  description TEXT,
  payment_method TEXT, -- card, oxxo, etc.
  receipt_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT payments_status_check CHECK (
    status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')
  ),
  CONSTRAINT payments_amount_positive CHECK (amount > 0),
  CONSTRAINT payments_service_amount_positive CHECK (service_amount > 0),
  CONSTRAINT payments_commission_percentage_valid CHECK (commission_percentage >= 0 AND commission_percentage <= 100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_professional_id ON public.payments(professional_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id ON public.payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at_trigger
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Patients can view their own payments
CREATE POLICY "Patients can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = patient_id);

-- Professionals can view payments related to their appointments
CREATE POLICY "Professionals can view their payments"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professional_applications
    WHERE professional_applications.user_id = auth.uid()
    AND professional_applications.id = payments.professional_id
  )
);

-- Only the system (service role) can insert payments
CREATE POLICY "System can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (true);

-- Only the system (service role) can update payments
CREATE POLICY "System can update payments"
ON public.payments
FOR UPDATE
USING (true);

-- Add comment to table
COMMENT ON TABLE public.payments IS 'Stores payment transactions for appointment reservations via Stripe';

