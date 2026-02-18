-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'Adetli Satış',
ADD COLUMN IF NOT EXISTS package_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS stock_tracking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS printer_id INTEGER,
ADD COLUMN IF NOT EXISTS label_printer_id INTEGER;

-- Create Storage Bucket for Products if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access to product images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'products' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'products' AND auth.role() = 'authenticated' );
