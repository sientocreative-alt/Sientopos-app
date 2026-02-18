-- Force fix for product_recipes table and permissions

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL, -- Removed FK constraint to avoid strict issues for now
    product_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    unit_id UUID,
    cost_at_time NUMERIC DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false
);

-- 2. Enable RLS
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to clean up conflicts
DROP POLICY IF EXISTS "Enable read access for own business" ON public.product_recipes;
DROP POLICY IF EXISTS "Enable insert access for own business" ON public.product_recipes;
DROP POLICY IF EXISTS "Enable update access for own business" ON public.product_recipes;
DROP POLICY IF EXISTS "Enable delete access for own business" ON public.product_recipes;
DROP POLICY IF EXISTS "Allow all actions for authenticated users" ON public.product_recipes;

-- 4. Create permissive policies for authenticated users
CREATE POLICY "Allow all actions for authenticated users"
ON public.product_recipes
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Notify to reload schema
NOTIFY pgrst, 'reload config';
