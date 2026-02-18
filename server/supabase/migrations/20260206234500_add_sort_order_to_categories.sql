-- Add sort_order column to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing categories to have a clean integer sort_order sequence
WITH ranked_categories AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) as new_order
    FROM public.categories
)
UPDATE public.categories c
SET sort_order = r.new_order
FROM ranked_categories r
WHERE c.id = r.id;
