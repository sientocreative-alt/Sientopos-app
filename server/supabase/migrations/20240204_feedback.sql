-- Create feedback_forms table
CREATE TABLE IF NOT EXISTS feedback_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    title TEXT NOT NULL,
    welcome_message TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- RLS Policies
ALTER TABLE feedback_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON feedback_forms
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = feedback_forms.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON feedback_forms
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = feedback_forms.business_id
    ));

CREATE POLICY "Enable update access for business users" ON feedback_forms
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = feedback_forms.business_id
    ));

CREATE POLICY "Enable delete access for business users" ON feedback_forms
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = feedback_forms.business_id
    ));
