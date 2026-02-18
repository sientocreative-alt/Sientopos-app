-- Create timed_discounts table
CREATE TABLE IF NOT EXISTS timed_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    title TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    discount_type TEXT DEFAULT 'percentage', -- 'percentage' or 'amount'
    discount_amount NUMERIC DEFAULT 0,
    target_type TEXT, -- 'category' or 'product'
    target_ids TEXT[], -- Array of IDs
    branch_name TEXT DEFAULT 'Merkez',
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- RLS Policies
ALTER TABLE timed_discounts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for business users" ON timed_discounts;
    DROP POLICY IF EXISTS "Enable insert access for business users" ON timed_discounts;
    DROP POLICY IF EXISTS "Enable update access for business users" ON timed_discounts;
    DROP POLICY IF EXISTS "Enable delete access for business users" ON timed_discounts;
END $$;

CREATE POLICY "Enable read access for business users" ON timed_discounts
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = timed_discounts.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON timed_discounts
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = timed_discounts.business_id
    ));

CREATE POLICY "Enable update access for business users" ON timed_discounts
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = timed_discounts.business_id
    ));

CREATE POLICY "Enable delete access for business users" ON timed_discounts
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = timed_discounts.business_id
    ));
