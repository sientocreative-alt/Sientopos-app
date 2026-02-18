-- Create customer_businesses table
CREATE TABLE IF NOT EXISTS public.customer_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    authorized_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    fax TEXT,
    tax_number TEXT,
    city TEXT,
    tax_office TEXT,
    status TEXT DEFAULT 'active',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for business users" ON public.customer_businesses;
CREATE POLICY "Enable read access for business users" ON public.customer_businesses
    FOR SELECT USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable insert for business users" ON public.customer_businesses;
CREATE POLICY "Enable insert for business users" ON public.customer_businesses
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for business users" ON public.customer_businesses;
CREATE POLICY "Enable update for business users" ON public.customer_businesses
    FOR UPDATE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable delete for business users" ON public.customer_businesses;
CREATE POLICY "Enable delete for business users" ON public.customer_businesses
    FOR DELETE USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_businesses_business_id ON public.customer_businesses(business_id);
