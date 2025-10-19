-- Update RLS policies for events_workshops table to support owner-based access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events_workshops;
DROP POLICY IF EXISTS "Events can be created by admins" ON events_workshops;
DROP POLICY IF EXISTS "Events can be updated by admins" ON events_workshops;
DROP POLICY IF EXISTS "Events can be deleted by admins" ON events_workshops;

-- Enable RLS
ALTER TABLE events_workshops ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active events
CREATE POLICY "Anyone can view active events"
ON events_workshops
FOR SELECT
USING (is_active = true);

-- Policy: Admins can view all events
CREATE POLICY "Admins can view all events"
ON events_workshops
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Policy: Event owners can view their events
CREATE POLICY "Event owners can view their events"
ON events_workshops
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Policy: Admins can create events
CREATE POLICY "Admins can create events"
ON events_workshops
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Policy: Admins can update all events
CREATE POLICY "Admins can update all events"
ON events_workshops
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Policy: Event owners can update their Stripe information
CREATE POLICY "Event owners can update their Stripe info"
ON events_workshops
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Policy: Admins can delete events
CREATE POLICY "Admins can delete events"
ON events_workshops
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'type')::text = 'admin'
  )
);

-- Add comment to document the policies
COMMENT ON TABLE events_workshops IS 'Events and workshops with owner-based access control. Admins can manage all events, owners can view and update their own events.';
