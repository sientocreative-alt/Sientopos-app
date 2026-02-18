-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    authorized_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    fax TEXT,
    city TEXT,
    tax_no TEXT,
    tax_office TEXT,
    tag TEXT,
    current_debt DECIMAL(12,2) DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for business users" ON public.suppliers;
CREATE POLICY "Enable read access for business users" ON public.suppliers
    FOR SELECT USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable insert for business users" ON public.suppliers;
CREATE POLICY "Enable insert for business users" ON public.suppliers
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for business users" ON public.suppliers;
CREATE POLICY "Enable update for business users" ON public.suppliers
    FOR UPDATE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Create index
CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON public.suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON public.suppliers(company_name);
