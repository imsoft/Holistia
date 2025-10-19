-- Add owner fields to events_workshops table
-- This allows events to be owned by admins, professionals, or regular users

ALTER TABLE events_workshops
ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN owner_type TEXT CHECK (owner_type IN ('admin', 'professional', 'patient'));

-- Create index for better query performance
CREATE INDEX idx_events_workshops_owner ON events_workshops(owner_id, owner_type);

-- Update existing events to have an owner (set to the professional_id if exists, otherwise created_by)
UPDATE events_workshops
SET
  owner_id = COALESCE(
    (SELECT user_id FROM professional_applications WHERE id = professional_id),
    created_by
  ),
  owner_type = CASE
    WHEN professional_id IS NOT NULL THEN 'professional'
    ELSE (
      SELECT
        CASE
          WHEN (raw_user_meta_data->>'type')::text = 'admin' THEN 'admin'
          ELSE 'patient'
        END
      FROM auth.users
      WHERE id = created_by
    )
  END
WHERE owner_id IS NULL;

-- Make owner fields required after migration
ALTER TABLE events_workshops
ALTER COLUMN owner_id SET NOT NULL,
ALTER COLUMN owner_type SET NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN events_workshops.owner_id IS 'The user who owns this event and will receive payments';
COMMENT ON COLUMN events_workshops.owner_type IS 'Type of owner: admin, professional, or patient';
