-- Add image_url to campaigns table
ALTER TABLE IF EXISTS campaigns
ADD COLUMN IF NOT EXISTS image_url TEXT;
