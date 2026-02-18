ALTER TABLE public.pos_settings
ADD COLUMN IF NOT EXISTS tax_plate_url TEXT;

-- Policy to allow public read of business-assets (if not already exists or specific policy needed)
-- Assuming 'business-assets' bucket exists and has public read.
-- If not, we might need to ensure bucket exists, but usually buckets are set up visually or via initial seeds.
-- We can add a policy ensuring authenticated users can upload to it.

-- Ensure the storage bucket 'business-assets' exists (idempotent check is hard in pure SQL without extensions, so we assume it exists from previous context or user will create it. 
-- Based on Settings.jsx, 'business-assets' bucket is already used for logos/kiosks.)
