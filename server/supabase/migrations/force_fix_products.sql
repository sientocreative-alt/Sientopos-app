-- Force fix for products table permissions and constraints

-- 1. Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to clean up conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for owners" ON public.products;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.products;
DROP POLICY IF EXISTS "Enable read access for own business" ON public.products;
DROP POLICY IF EXISTS "Enable insert access for own business" ON public.products;
DROP POLICY IF EXISTS "Enable update access for own business" ON public.products;
DROP POLICY IF EXISTS "Enable delete access for own business" ON public.products;
DROP POLICY IF EXISTS "Public Access" ON public.products;

-- 3. Create permissive policies for authenticated users
CREATE POLICY "Allow all actions for authenticated users"
ON public.products
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Ensure constraints are relaxed
ALTER TABLE public.products ALTER COLUMN category_id DROP NOT NULL;

-- 5. Ensure new columns exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_category_id UUID REFERENCES public.stock_categories(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_unit_id UUID REFERENCES public.stock_units(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS critical_stock_level NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_recipe BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_tracking BOOLEAN DEFAULT false;

-- 6. Check if product_type has a constraint and drop it if necessary (advanced, but assuming text is fine)
-- If there is a check constraint, we might need to drop it. 
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_product_type_check') THEN
--         ALTER TABLE public.products DROP CONSTRAINT products_product_type_check;
--     END IF;
-- END $$;
