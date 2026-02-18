-- Create seating_areas table
CREATE TABLE IF NOT EXISTS seating_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    name TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for seating_areas
ALTER TABLE seating_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON seating_areas
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = seating_areas.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON seating_areas
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = seating_areas.business_id
    ));

CREATE POLICY "Enable update access for business users" ON seating_areas
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = seating_areas.business_id
    ));

CREATE POLICY "Enable delete access for business users" ON seating_areas
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = seating_areas.business_id
    ));

-- Add seating_area_id to tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'seating_area_id') THEN
        ALTER TABLE tables ADD COLUMN seating_area_id UUID REFERENCES seating_areas(id);
    END IF;
END $$;
