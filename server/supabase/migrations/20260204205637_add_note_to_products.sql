ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS note text DEFAULT null;
