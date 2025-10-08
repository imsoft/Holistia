-- =====================================================
-- MIGRACIONES PARA SISTEMA DE PAGOS DE EVENTOS
-- =====================================================
-- Este script aplica todas las migraciones necesarias para
-- implementar el sistema de pagos de eventos con comisión del 25%

-- 1. Crear tabla event_registrations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship with event
  event_id UUID NOT NULL REFERENCES public.events_workshops(id) ON DELETE CASCADE,
  
  -- User information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Registration details
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  -- Possible statuses: pending, confirmed, cancelled, completed
  
  -- Additional information
  notes TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  special_requirements TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT event_registrations_status_check CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  
  -- Unique constraint: one registration per user per event
  CONSTRAINT event_registrations_user_event_unique UNIQUE (event_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);

-- Add RLS policies
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own registrations
CREATE POLICY "Users can view own event registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own registrations
CREATE POLICY "Users can insert own event registrations" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own registrations
CREATE POLICY "Users can update own event registrations" ON public.event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for admins to view all registrations
CREATE POLICY "Admins can view all event registrations" ON public.event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'type' = 'admin'
    )
  );

-- Policy for admins to update all registrations
CREATE POLICY "Admins can update all event registrations" ON public.event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'type' = 'admin'
    )
  );

-- Policy for professionals to view registrations for their events
CREATE POLICY "Professionals can view registrations for their events" ON public.event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events_workshops ew
      JOIN public.professional_applications pa ON pa.id = ew.professional_id
      WHERE ew.id = event_registrations.event_id
      AND pa.user_id = auth.uid()
    )
  );

-- 2. Actualizar tabla payments para soportar eventos
-- =====================================================

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
-- Events will use 25%, appointments will continue using 15%
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

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 'Migraciones aplicadas exitosamente' as status;

-- Verificar que las tablas se crearon correctamente
SELECT 'Tabla event_registrations:' as tabla, count(*) as registros FROM public.event_registrations;

-- Verificar estructura de payments actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
