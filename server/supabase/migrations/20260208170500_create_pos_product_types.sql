-- Create pos_product_types table
CREATE TABLE IF NOT EXISTS public.pos_product_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.pos_product_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own pos product types" 
    ON public.pos_product_types FOR SELECT 
    USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own pos product types" 
    ON public.pos_product_types FOR INSERT 
    WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own pos product types" 
    ON public.pos_product_types FOR UPDATE 
    USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));
