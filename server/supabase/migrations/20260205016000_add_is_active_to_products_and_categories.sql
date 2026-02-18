-- Add is_active column to products and categories tables
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
