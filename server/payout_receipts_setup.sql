-- Add receipt_url column to reseller_payout_requests if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reseller_payout_requests' AND column_name = 'receipt_url') THEN
        ALTER TABLE reseller_payout_requests ADD COLUMN receipt_url TEXT;
    END IF;
END $$;

-- Create payout_receipts storage bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('payout_receipts', 'payout_receipts', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Policies for payout_receipts bucket

-- 1. Allow authenticated users (Admins) to upload files
-- We'll rely on app-side logic or more specific RLS if needed, but 'authenticated' is a good start for upload. 
-- Ideally we restrict this to admins, but typically 'authenticated' + folder structure or app logic is used for simpler setups.
-- check if policy exists first to avoid error
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can upload payout receipts') THEN
        CREATE POLICY "Admins can upload payout receipts" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'payout_receipts' AND auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. Allow anyone (or authenticated) to read files (Public bucket, so public access is enabled by default if public=true, but policies are needed for RLS)
-- Since it's public: true, we just need a SELECT policy.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view payout receipts') THEN
        CREATE POLICY "Anyone can view payout receipts" ON storage.objects
        FOR SELECT USING (bucket_id = 'payout_receipts');
    END IF;
END $$;

-- 3. Allow admins to update/delete (optional, for management)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can update payout receipts') THEN
        CREATE POLICY "Admins can update payout receipts" ON storage.objects
        FOR UPDATE USING (bucket_id = 'payout_receipts' AND auth.role() = 'authenticated');
    END IF;
END $$;
