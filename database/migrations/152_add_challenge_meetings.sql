-- ============================================================================
-- MIGRATION 152: Add Challenge Meetings
-- Description: Adds support for scheduled video calls (Meet/Zoom) in challenges
-- Author: Claude Code
-- Date: 2026-01-07
-- ============================================================================

-- ============================================================================
-- 1. CREATE challenge_meetings TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,

  -- Meeting details
  title TEXT NOT NULL,
  description TEXT,

  -- Platform
  platform TEXT NOT NULL CHECK (platform IN ('meet', 'zoom', 'teams', 'other')),
  meeting_url TEXT NOT NULL,
  meeting_id TEXT, -- ID de la reunión (para Zoom, Meet, etc.)
  passcode TEXT, -- Contraseña de la reunión si aplica

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT DEFAULT 'America/Mexico_City',

  -- Recurrence (opcional para reuniones recurrentes)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'weekly', 'biweekly', 'monthly'
  recurrence_end_date DATE,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  max_participants INTEGER,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_meeting_url CHECK (meeting_url ~* '^https?://'),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenge_meetings_challenge_id ON public.challenge_meetings(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_meetings_scheduled_date ON public.challenge_meetings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_challenge_meetings_status ON public.challenge_meetings(status);
CREATE INDEX IF NOT EXISTS idx_challenge_meetings_active ON public.challenge_meetings(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. CREATE challenge_meeting_participants TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenge_meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.challenge_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Participation details
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('invited', 'confirmed', 'attended', 'no_show', 'cancelled')) DEFAULT 'invited',

  -- Timestamps
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: cada usuario solo puede estar una vez en cada reunión
  CONSTRAINT unique_meeting_participant UNIQUE (meeting_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON public.challenge_meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user_id ON public.challenge_meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_status ON public.challenge_meeting_participants(attendance_status);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.challenge_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_meeting_participants ENABLE ROW LEVEL SECURITY;

-- Challenge Meetings Policies

-- SELECT: Users can view meetings for challenges they have access to
CREATE POLICY "Users can view challenge meetings" ON public.challenge_meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_meetings.challenge_id
      AND (
        c.created_by_user_id = auth.uid()
        OR c.linked_patient_id = auth.uid()
        OR c.linked_professional_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.challenge_purchases cp
          WHERE cp.challenge_id = c.id
          AND cp.buyer_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.challenge_teams ct
          JOIN public.challenge_team_members ctm ON ct.id = ctm.team_id
          WHERE ct.challenge_id = c.id
          AND ctm.user_id = auth.uid()
        )
      )
    )
  );

-- INSERT: Only challenge creators can create meetings
CREATE POLICY "Challenge creators can create meetings" ON public.challenge_meetings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_meetings.challenge_id
      AND c.created_by_user_id = auth.uid()
    )
  );

-- UPDATE: Only challenge creators can update meetings
CREATE POLICY "Challenge creators can update meetings" ON public.challenge_meetings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_meetings.challenge_id
      AND c.created_by_user_id = auth.uid()
    )
  );

-- DELETE: Only challenge creators can delete meetings
CREATE POLICY "Challenge creators can delete meetings" ON public.challenge_meetings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_meetings.challenge_id
      AND c.created_by_user_id = auth.uid()
    )
  );

-- Meeting Participants Policies

-- SELECT: Users can view participants if they can view the meeting
CREATE POLICY "Users can view meeting participants" ON public.challenge_meeting_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_meetings cm
      JOIN public.challenges c ON c.id = cm.challenge_id
      WHERE cm.id = challenge_meeting_participants.meeting_id
      AND (
        c.created_by_user_id = auth.uid()
        OR challenge_meeting_participants.user_id = auth.uid()
        OR c.linked_patient_id = auth.uid()
        OR c.linked_professional_id = auth.uid()
      )
    )
  );

-- INSERT: Challenge creators can add participants
CREATE POLICY "Challenge creators can add participants" ON public.challenge_meeting_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_meetings cm
      JOIN public.challenges c ON c.id = cm.challenge_id
      WHERE cm.id = challenge_meeting_participants.meeting_id
      AND c.created_by_user_id = auth.uid()
    )
  );

-- UPDATE: Challenge creators and the participant themselves can update
CREATE POLICY "Users can update participant status" ON public.challenge_meeting_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_meetings cm
      JOIN public.challenges c ON c.id = cm.challenge_id
      WHERE cm.id = challenge_meeting_participants.meeting_id
      AND (
        c.created_by_user_id = auth.uid()
        OR challenge_meeting_participants.user_id = auth.uid()
      )
    )
  );

-- DELETE: Only challenge creators can remove participants
CREATE POLICY "Challenge creators can remove participants" ON public.challenge_meeting_participants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_meetings cm
      JOIN public.challenges c ON c.id = cm.challenge_id
      WHERE cm.id = challenge_meeting_participants.meeting_id
      AND c.created_by_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. TRIGGERS FOR updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_challenge_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_meeting_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS challenge_meetings_updated_at ON public.challenge_meetings;
CREATE TRIGGER challenge_meetings_updated_at
  BEFORE UPDATE ON public.challenge_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_meetings_updated_at();

DROP TRIGGER IF EXISTS meeting_participants_updated_at ON public.challenge_meeting_participants;
CREATE TRIGGER meeting_participants_updated_at
  BEFORE UPDATE ON public.challenge_meeting_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_participants_updated_at();

-- ============================================================================
-- 5. HELPFUL VIEWS
-- ============================================================================

-- View para ver reuniones con conteo de participantes
DROP VIEW IF EXISTS public.challenge_meetings_with_stats;
CREATE VIEW public.challenge_meetings_with_stats AS
SELECT
  cm.*,
  COUNT(cmp.id) FILTER (WHERE cmp.attendance_status = 'confirmed') as confirmed_count,
  COUNT(cmp.id) FILTER (WHERE cmp.attendance_status = 'attended') as attended_count,
  COUNT(cmp.id) as total_participants
FROM public.challenge_meetings cm
LEFT JOIN public.challenge_meeting_participants cmp ON cm.id = cmp.meeting_id
GROUP BY cm.id;

-- ============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.challenge_meetings IS 'Stores scheduled video calls for challenges';
COMMENT ON TABLE public.challenge_meeting_participants IS 'Tracks participants for each challenge meeting';
COMMENT ON COLUMN public.challenge_meetings.platform IS 'Video call platform: meet, zoom, teams, other';
COMMENT ON COLUMN public.challenge_meetings.recurrence_pattern IS 'For recurring meetings: weekly, biweekly, monthly';
COMMENT ON COLUMN public.challenge_meeting_participants.attendance_status IS 'Participant status: invited, confirmed, attended, no_show, cancelled';

-- ============================================================================
-- END OF MIGRATION 152
-- ============================================================================
