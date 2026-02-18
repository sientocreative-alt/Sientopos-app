CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    can_credit BOOLEAN DEFAULT false,
    balance NUMERIC DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customers" 
ON public.customers FOR SELECT 
USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = customers.business_id));

CREATE POLICY "Users can insert their own customers" 
ON public.customers FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = customers.business_id));

CREATE POLICY "Users can update their own customers" 
ON public.customers FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = customers.business_id));

CREATE POLICY "Users can delete their own customers" 
ON public.customers FOR DELETE 
USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = customers.business_id));
