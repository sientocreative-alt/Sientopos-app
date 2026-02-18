-- Fix Category Deletion Error
-- Problem: Deleting a category fails because products reference it.
-- Solution: Change the foreign key constraint to "ON DELETE SET NULL".
-- This keeps the products but removes their category association.

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

ALTER TABLE public.products
ADD CONSTRAINT products_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL;
