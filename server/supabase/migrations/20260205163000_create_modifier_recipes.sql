-- Create modifier_recipes table
CREATE TABLE IF NOT EXISTS public.modifier_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES modifier_options(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    amount DECIMAL(10,3) DEFAULT 0,
    unit TEXT DEFAULT 'Adet'
);

-- Enable RLS
ALTER TABLE public.modifier_recipes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own modifier recipes" 
    ON public.modifier_recipes FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_recipes.business_id));

CREATE POLICY "Users can insert their own modifier recipes" 
    ON public.modifier_recipes FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_recipes.business_id));

CREATE POLICY "Users can update their own modifier recipes" 
    ON public.modifier_recipes FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_recipes.business_id));

CREATE POLICY "Users can delete their own modifier recipes" 
    ON public.modifier_recipes FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_recipes.business_id));
