CREATE TABLE IF NOT EXISTS public.delivery_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    description TEXT,
    contact_number TEXT,
    is_deleted BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.delivery_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery customers" 
ON public.delivery_customers FOR SELECT 
USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = delivery_customers.business_id));

CREATE POLICY "Users can insert their own delivery customers" 
ON public.delivery_customers FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = delivery_customers.business_id));

CREATE POLICY "Users can update their own delivery customers" 
ON public.delivery_customers FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = delivery_customers.business_id));

CREATE POLICY "Users can delete their own delivery customers" 
ON public.delivery_customers FOR DELETE 
USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = delivery_customers.business_id));
