-- Create the 'details' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('details', 'details', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to all files in the bucket
-- Renamed to avoid conflict with generic "Public Access"
DROP POLICY IF EXISTS "Public Access Details" ON storage.objects;
CREATE POLICY "Public Access Details"
ON storage.objects FOR SELECT
USING ( bucket_id = 'details' );

-- Policy: Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated Upload Details" ON storage.objects;
CREATE POLICY "Authenticated Upload Details"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'details' );

-- Policy: Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Authenticated Update Details" ON storage.objects;
CREATE POLICY "Authenticated Update Details"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'details' );
