-- Update products table with stock product fields
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_category_id UUID REFERENCES public.stock_categories(id),
ADD COLUMN IF NOT EXISTS default_unit_id UUID REFERENCES public.stock_units(id),
ADD COLUMN IF NOT EXISTS critical_stock_level NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_recipe BOOLEAN DEFAULT false;

-- Make business_id and category_id nullable? No business_id should be required. 
-- But category_id (Menu Category) should be nullable for purely stock items (Hammadde).
ALTER TABLE public.products ALTER COLUMN category_id DROP NOT NULL;
