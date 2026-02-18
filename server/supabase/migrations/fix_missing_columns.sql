-- Add missing timestamp columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Notify PostgREST to reload schema cache (usually happens on DDL, but being explicit looks good)
NOTIFY pgrst, 'reload config';
