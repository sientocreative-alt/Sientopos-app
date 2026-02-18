-- Create menu_analytics table
CREATE TABLE IF NOT EXISTS menu_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    table_id UUID REFERENCES tables(id), -- Nullable if scanned without a specific table (e.g. general QR)
    device_type TEXT,
    browser TEXT,
    os TEXT
);

-- Enable RLS
ALTER TABLE menu_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON menu_analytics
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = menu_analytics.business_id
    ));

CREATE POLICY "Enable insert access for public/anon" ON menu_analytics
    FOR INSERT
    WITH CHECK (true); -- Allow anyone to insert analytics (for public QR scans)

-- Optional: Create a view or function for report aggregation if needed later
