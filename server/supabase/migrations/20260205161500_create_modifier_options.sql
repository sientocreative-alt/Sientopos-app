-- Create modifier_options table
CREATE TABLE IF NOT EXISTS public.modifier_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    order_number INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own modifier options" 
    ON public.modifier_options FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_options.business_id));

CREATE POLICY "Users can insert their own modifier options" 
    ON public.modifier_options FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_options.business_id));

CREATE POLICY "Users can update their own modifier options" 
    ON public.modifier_options FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_options.business_id));

CREATE POLICY "Users can delete their own modifier options" 
    ON public.modifier_options FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_options.business_id));
