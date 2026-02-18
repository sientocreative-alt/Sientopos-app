-- Create waiter_calls table for customer waiter call requests
CREATE TABLE IF NOT EXISTS waiter_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waiter_calls_business ON waiter_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON waiter_calls(status);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_created ON waiter_calls(created_at DESC);

-- Enable Row Level Security
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Businesses can view their own waiter calls
CREATE POLICY "Businesses can view own waiter calls"
  ON waiter_calls FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM staff WHERE id = auth.uid()
  ));

-- Policy: Businesses can insert waiter calls (for QR menu)
CREATE POLICY "Anyone can insert waiter calls"
  ON waiter_calls FOR INSERT
  WITH CHECK (true);

-- Policy: Businesses can update their own waiter calls
CREATE POLICY "Businesses can update own waiter calls"
  ON waiter_calls FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM staff WHERE id = auth.uid()
  ));

-- Add enable_waiter_call setting to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS enable_waiter_call BOOLEAN DEFAULT false;

-- Comment
COMMENT ON TABLE waiter_calls IS 'Stores customer waiter call requests from QR menu';
COMMENT ON COLUMN businesses.enable_waiter_call IS 'Enable/disable waiter call feature for this business';
