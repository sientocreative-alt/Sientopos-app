-- Create happy_hours table
CREATE TABLE IF NOT EXISTS happy_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    title TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    discount_type TEXT DEFAULT 'percentage', -- 'percentage' or 'amount'
    discount_amount NUMERIC DEFAULT 0,
    target_type TEXT, -- 'category' or 'product'
    target_ids TEXT[], -- Array of IDs for selected categories or products
    branch_name TEXT DEFAULT 'Merkez',
    
    -- Store the complex weekly schedule as JSONB
    -- Structure example: 
    -- { 
    --   "monday": { "active": true, "startTime": "18:00", "endTime": "20:00" },
    --   "tuesday": { "active": false, ... }
    -- }
    days_config JSONB DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- RLS Policies (using profiles as learned from previous error)
ALTER TABLE happy_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON happy_hours
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = happy_hours.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON happy_hours
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = happy_hours.business_id
    ));

CREATE POLICY "Enable update access for business users" ON happy_hours
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = happy_hours.business_id
    ));

CREATE POLICY "Enable delete access for business users" ON happy_hours
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = happy_hours.business_id
    ));
