-- Migration: Allow admin users to read all appointments and payments
-- This ensures admin dashboard can display financial data and patient statistics

-- ============================================================================
-- APPOINTMENTS - Admin Read Access
-- ============================================================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;

-- Create policy for admins to read all appointments
CREATE POLICY "Admins can view all appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  );

-- ============================================================================
-- PAYMENTS - Admin Read Access
-- ============================================================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Create policy for admins to read all payments
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.type = 'admin'
      AND profiles.account_active = true
    )
  );

-- ============================================================================
-- Verification
-- ============================================================================

-- To verify these policies work, run:
-- SELECT * FROM appointments LIMIT 1;
-- SELECT * FROM payments LIMIT 1;
-- (as an admin user)

COMMENT ON POLICY "Admins can view all appointments" ON appointments IS
  'Allows admin users to view all appointments for dashboard statistics and patient counting';

COMMENT ON POLICY "Admins can view all payments" ON payments IS
  'Allows admin users to view all payments for financial reporting and analytics';
