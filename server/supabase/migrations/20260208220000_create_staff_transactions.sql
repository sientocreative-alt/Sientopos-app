-- Create staff_transactions table for personnel payments and debts
CREATE TABLE IF NOT EXISTS public.staff_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    
    transaction_type TEXT NOT NULL, -- 'Borç' (Debt/Advance), 'Ödeme' (Payment)
    category TEXT, -- 'Maaş', 'Avans', 'Prim', 'Yemek', 'Yol', 'Diğer' etc.
    payment_method TEXT, -- 'Nakit', 'Havale/EFT', 'Kredi Kartı'
    
    amount DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    file_url TEXT,
    
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.staff_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for business users" ON public.staff_transactions;
CREATE POLICY "Enable read access for business users" ON public.staff_transactions
    FOR SELECT USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable insert for business users" ON public.staff_transactions;
CREATE POLICY "Enable insert for business users" ON public.staff_transactions
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for business users" ON public.staff_transactions;
CREATE POLICY "Enable update for business users" ON public.staff_transactions
    FOR UPDATE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable delete for business users" ON public.staff_transactions;
CREATE POLICY "Enable delete for business users" ON public.staff_transactions
    FOR DELETE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_transactions_business_id ON public.staff_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_transactions_staff_id ON public.staff_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_transactions_transaction_date ON public.staff_transactions(transaction_date);
