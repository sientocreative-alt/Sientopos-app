-- Create supplier_transactions table
CREATE TABLE IF NOT EXISTS public.supplier_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    invoice_no TEXT,
    description TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase_invoice', 'payment', 'waybill')),
    credit DECIMAL(12,2) DEFAULT 0, -- Alacak
    debt DECIMAL(12,2) DEFAULT 0,   -- Borç
    payment DECIMAL(12,2) DEFAULT 0, -- Ödeme
    balance DECIMAL(12,2) DEFAULT 0, -- Bakiye
    performed_by UUID REFERENCES public.staff(id),
    approval_status BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for business users" ON public.supplier_transactions;
CREATE POLICY "Enable read access for business users" ON public.supplier_transactions
    FOR SELECT USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable insert for business users" ON public.supplier_transactions;
CREATE POLICY "Enable insert for business users" ON public.supplier_transactions
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for business users" ON public.supplier_transactions;
CREATE POLICY "Enable update for business users" ON public.supplier_transactions
    FOR UPDATE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Create index
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_business_id ON public.supplier_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_supplier_id ON public.supplier_transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_date ON public.supplier_transactions(date);
