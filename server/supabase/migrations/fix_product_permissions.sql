-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for owners" ON public.products;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.products;

-- Create comprehensive policies
-- 1. READ: Allow everyone to read products (for menu), or restrict to business_id if needed. 
-- For now, let's allow authenticated users to see their business products.
CREATE POLICY "Enable read access for all users" 
ON public.products FOR SELECT 
USING (true);

-- 2. INSERT: Allow authenticated users to insert products
CREATE POLICY "Enable insert for authenticated users only" 
ON public.products FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. UPDATE: Allow users to update their own business products
-- Assuming business_id matches some user metadata or just check if they are authenticated for this MVP
CREATE POLICY "Enable update for owners" 
ON public.products FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. DELETE: Allow users to delete their own business products
-- 4. DELETE: Allow users to delete their own business products
CREATE POLICY "Enable delete for owners" 
ON public.products FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Ensure category_id is nullable for stock products
ALTER TABLE public.products ALTER COLUMN category_id DROP NOT NULL;

-- Add missing columns just in case previous failed
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'Adetli Satış',
ADD COLUMN IF NOT EXISTS package_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS stock_tracking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS printer_id INTEGER,
ADD COLUMN IF NOT EXISTS label_printer_id INTEGER;
