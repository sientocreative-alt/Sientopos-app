-- Enable RLS on the table (if not already enabled)
ALTER TABLE qr_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to qr_settings
CREATE POLICY "Public read access for qr_settings"
ON qr_settings FOR SELECT
TO public
USING (true);

-- Allow anon read access (explicitly if needed, though 'public' usually covers it)
CREATE POLICY "Anon read access for qr_settings"
ON qr_settings FOR SELECT
TO anon
USING (true);
