-- Create discount_types table
CREATE TABLE IF NOT EXISTS public.discount_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- İndirim Adı
    type TEXT NOT NULL, -- İndirim Türü (e.g., Yüzdelik İndirim, Sabit İndirim)
    amount NUMERIC NOT NULL, -- İndirim Miktarı
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.discount_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own discount types" 
    ON public.discount_types FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = discount_types.business_id));

CREATE POLICY "Users can insert their own discount types" 
    ON public.discount_types FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = discount_types.business_id));

CREATE POLICY "Users can update their own discount types" 
    ON public.discount_types FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = discount_types.business_id));

CREATE POLICY "Users can delete their own discount types" 
    ON public.discount_types FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = discount_types.business_id));
