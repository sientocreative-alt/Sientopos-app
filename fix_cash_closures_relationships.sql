
-- Fix foreign key relationships for cash_closures to enable Supabase joins
-- This allows Supabase to join cash_closures.created_by to public.profiles.id
ALTER TABLE public.cash_closures 
DROP CONSTRAINT IF EXISTS cash_closures_created_by_fkey,
ADD CONSTRAINT cash_closures_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.cash_closure_expenses
DROP CONSTRAINT IF EXISTS cash_closure_expenses_staff_id_fkey,
ADD CONSTRAINT cash_closure_expenses_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Optimize RLS policies to avoid potential recursion or subquery issues
DROP POLICY IF EXISTS "Users can view their business cash closures" ON public.cash_closures;
CREATE POLICY "Users can view their business cash closures" 
ON public.cash_closures FOR SELECT 
USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Users can insert their business cash closures" ON public.cash_closures;
CREATE POLICY "Users can insert their business cash closures" 
ON public.cash_closures FOR INSERT 
WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Users can update their business cash closures" ON public.cash_closures;
CREATE POLICY "Users can update their business cash closures" 
ON public.cash_closures FOR UPDATE 
USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1))
WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));
