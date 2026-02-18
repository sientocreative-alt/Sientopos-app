-- Drop existing policies if they exist
DROP POLICY IF EXISTS customer_feedback_insert_policy ON customer_feedback;
DROP POLICY IF EXISTS customer_feedback_service_policy ON customer_feedback;
DROP POLICY IF EXISTS customer_feedback_select_policy ON customer_feedback;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_customer_feedback_business_id;
DROP INDEX IF EXISTS idx_customer_feedback_created_at;

-- Drop existing table if it exists
DROP TABLE IF EXISTS customer_feedback;

-- Create customer_feedback table
CREATE TABLE customer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_customer_feedback_business_id ON customer_feedback(business_id);
CREATE INDEX idx_customer_feedback_created_at ON customer_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow INSERT from anyone (public feedback form)
CREATE POLICY customer_feedback_insert_policy ON customer_feedback
    FOR INSERT
    WITH CHECK (true);

-- RLS Policy: Allow SELECT/UPDATE/DELETE only via service role
-- Business owners will access feedback through backend API with service key
CREATE POLICY customer_feedback_service_policy ON customer_feedback
    FOR ALL
    USING (auth.role() = 'service_role');
