-- Create tables table if it doesn't exist (assuming basic structure)
CREATE TABLE IF NOT EXISTS tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS for tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON tables
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tables.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON tables
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tables.business_id
    ));

CREATE POLICY "Enable update access for business users" ON tables
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tables.business_id
    ));

CREATE POLICY "Enable delete access for business users" ON tables
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tables.business_id
    ));

-- Create qr_settings table
CREATE TABLE IF NOT EXISTS qr_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) UNIQUE, -- One settings row per business
    
    -- Location Settings
    place_name TEXT,
    slug TEXT UNIQUE,
    is_ordering_enabled BOOLEAN DEFAULT false,
    show_optional_products BOOLEAN DEFAULT false,
    is_name_required BOOLEAN DEFAULT false,
    use_location BOOLEAN DEFAULT false,
    allow_waiter_call BOOLEAN DEFAULT false,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    ordering_distance INTEGER,
    wifi_name TEXT,
    wifi_password TEXT,
    city TEXT,
    country TEXT,
    district TEXT,
    neighborhood TEXT,
    zip_code TEXT,
    website TEXT,
    tax_office TEXT,
    tax_number TEXT,
    timezone TEXT,
    google_place_id TEXT,
    logo_url TEXT,

    -- Social Accounts
    social_instagram TEXT,
    social_twitter TEXT,
    social_youtube TEXT,
    social_facebook TEXT,
    social_tiktok TEXT,
    social_foursquare TEXT
);

-- RLS Policies for qr_settings
ALTER TABLE qr_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for business users" ON qr_settings
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = qr_settings.business_id
    ));

CREATE POLICY "Enable insert access for business users" ON qr_settings
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = qr_settings.business_id
    ));

CREATE POLICY "Enable update access for business users" ON qr_settings
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = qr_settings.business_id
    ));
