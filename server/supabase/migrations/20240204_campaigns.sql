-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    branch_name TEXT, -- Or branch_id if we have a branches table, but for now just text or we can link if branches exist. User image showed "Şube".
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON campaigns
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = campaigns.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON campaigns
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = campaigns.business_id
    ));

CREATE POLICY "Enable update access for business users" ON campaigns
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = campaigns.business_id
    ));

CREATE POLICY "Enable delete access for business users" ON campaigns
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = campaigns.business_id
    ));
