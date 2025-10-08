-- Create event_registrations table for event bookings
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
