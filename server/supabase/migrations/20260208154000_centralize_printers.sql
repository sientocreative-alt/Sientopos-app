-- Fix products table printer columns type
ALTER TABLE public.products 
ALTER COLUMN printer_id TYPE uuid USING (NULL),
ALTER COLUMN label_printer_id TYPE uuid USING (NULL);

-- Update categories table with printer columns
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS printer_id uuid,
ADD COLUMN IF NOT EXISTS label_printer_id uuid;

-- Add printer_id to order_items to track where items should be printed
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS printer_id uuid;
