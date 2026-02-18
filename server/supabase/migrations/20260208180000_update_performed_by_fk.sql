-- Update performed_by to reference profiles instead of staff
-- This allows tracking transactions for both owners and staff
ALTER TABLE public.supplier_transactions 
DROP CONSTRAINT IF EXISTS supplier_transactions_performed_by_fkey,
ADD CONSTRAINT supplier_transactions_performed_by_fkey 
FOREIGN KEY (performed_by) REFERENCES public.profiles(id);
