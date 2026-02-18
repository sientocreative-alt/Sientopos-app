-- Add sort_order to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
