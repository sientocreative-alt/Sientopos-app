-- Create product_recipes table
CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, -- The parent product (e.g. Latte)
    ingredient_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, -- The ingredient (e.g. Milk)
    amount NUMERIC NOT NULL DEFAULT 0,
    unit_id UUID REFERENCES public.stock_units(id), -- Unit of the amount
    cost_at_time NUMERIC DEFAULT 0, -- Snapshot of cost when added (optional)
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for own business" ON public.product_recipes
FOR SELECT USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable insert access for own business" ON public.product_recipes
FOR INSERT WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable update access for own business" ON public.product_recipes
FOR UPDATE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable delete access for own business" ON public.product_recipes
FOR DELETE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger/Function to update cost of parent product (Optional, complex to do in SQL right now, will handle in logic for now)
