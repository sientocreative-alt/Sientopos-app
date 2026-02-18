-- Create qr_menus table
CREATE TABLE IF NOT EXISTS qr_menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE qr_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON qr_menus
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = qr_menus.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON qr_menus
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = qr_menus.business_id
    ));

CREATE POLICY "Enable update access for business users" ON qr_menus
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = qr_menus.business_id
    ));

CREATE POLICY "Enable delete access for business users" ON qr_menus
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = qr_menus.business_id
    ));
