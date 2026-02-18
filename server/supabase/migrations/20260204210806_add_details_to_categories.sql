ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS description text DEFAULT null,
ADD COLUMN IF NOT EXISTS note text DEFAULT null,
ADD COLUMN IF NOT EXISTS image_url text DEFAULT null;
