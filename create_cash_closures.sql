-- Create cash_closures table
CREATE TABLE IF NOT EXISTS public.cash_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_balance NUMERIC(10,2) DEFAULT 0,
    -- Denominations (Notes & Coins)
    n200 INTEGER DEFAULT 0,
    n100 INTEGER DEFAULT 0,
    n50 INTEGER DEFAULT 0,
    n20 INTEGER DEFAULT 0,
    n10 INTEGER DEFAULT 0,
    n5 INTEGER DEFAULT 0,
    n1 INTEGER DEFAULT 0,
    n05 INTEGER DEFAULT 0,
    n025 INTEGER DEFAULT 0,
    n010 INTEGER DEFAULT 0,
    n005 INTEGER DEFAULT 0,
    -- Totals
    cash_entered NUMERIC(10,2) DEFAULT 0,
    cash_system NUMERIC(10,2) DEFAULT 0,
    cc_entered NUMERIC(10,2) DEFAULT 0,
    cc_system NUMERIC(10,2) DEFAULT 0,
    total_expenses NUMERIC(10,2) DEFAULT 0,
    difference NUMERIC(10,2) DEFAULT 0,
    is_confirmed BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cash_closure_expenses table
CREATE TABLE IF NOT EXISTS public.cash_closure_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_closure_id UUID REFERENCES public.cash_closures(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    staff_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closure_expenses ENABLE ROW LEVEL SECURITY;

-- Policies for cash_closures
CREATE POLICY "Users can view their business cash closures" 
ON public.cash_closures FOR SELECT 
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their business cash closures" 
ON public.cash_closures FOR INSERT 
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their business cash closures" 
ON public.cash_closures FOR UPDATE 
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their business cash closures" 
ON public.cash_closures FOR DELETE 
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for cash_closure_expenses
CREATE POLICY "Users can view their business cash closure expenses" 
ON public.cash_closure_expenses FOR SELECT 
USING (cash_closure_id IN (SELECT id FROM public.cash_closures WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can insert their business cash closure expenses" 
ON public.cash_closure_expenses FOR INSERT 
WITH CHECK (cash_closure_id IN (SELECT id FROM public.cash_closures WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can delete their business cash closure expenses" 
ON public.cash_closure_expenses FOR DELETE 
USING (cash_closure_id IN (SELECT id FROM public.cash_closures WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
