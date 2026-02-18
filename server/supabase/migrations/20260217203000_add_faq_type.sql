-- Add type column to faqs table
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'business';

-- Update existing faqs to be 'business' (just in case)
UPDATE public.faqs SET type = 'business' WHERE type IS NULL;
