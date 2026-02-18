-- 1. Fix RLS policies to use the profiles table
-- Drop existing policies first
DROP POLICY IF EXISTS "Businesses can view own waiter calls" ON waiter_calls;
DROP POLICY IF EXISTS "Businesses can update own waiter calls" ON waiter_calls;

-- Re-create SELECT policy using profiles table
CREATE POLICY "Businesses can view own waiter calls"
  ON waiter_calls FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  ));

-- Re-create UPDATE policy using profiles table
CREATE POLICY "Businesses can update own waiter calls"
  ON waiter_calls FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  ));

-- 2. Enable Real-time replication safely (won't error if already member)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'waiter_calls'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE waiter_calls;
    END IF;
END $$;
