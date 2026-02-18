-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_type TEXT NOT NULL, -- Gelir, Gider, Ödeme, İrsaliye, Tahsilat
    record_type TEXT, -- Dynamic based on invoice_type
    receiver_type TEXT, -- Müşteri, Şube, vb.
    customer_business_id UUID REFERENCES public.customer_businesses(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    invoice_no TEXT,
    issue_date DATE,
    payment_date DATE,
    amount DECIMAL(12,2) DEFAULT 0,
    tax_otv_amount DECIMAL(12,2) DEFAULT 0,
    tax_kdv_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'approved',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for business users" ON public.invoices;
CREATE POLICY "Enable read access for business users" ON public.invoices
    FOR SELECT USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable insert for business users" ON public.invoices;
CREATE POLICY "Enable insert for business users" ON public.invoices
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for business users" ON public.invoices;
CREATE POLICY "Enable update for business users" ON public.invoices
    FOR UPDATE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable delete for business users" ON public.invoices;
CREATE POLICY "Enable delete for business users" ON public.invoices
    FOR DELETE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON public.invoices(invoice_type);
