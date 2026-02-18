-- Create modifier_groups table
CREATE TABLE IF NOT EXISTS public.modifier_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Gösterim Adı
    internal_name TEXT, -- Opsiyon Adı
    selection_type TEXT DEFAULT 'Tekli Seçim', -- 'Tekli Seçim' or 'Çoklu Seçim'
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;

-- Post Policies
CREATE POLICY "Users can view their own details" 
    ON public.modifier_groups FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_groups.business_id));

CREATE POLICY "Users can insert their own details" 
    ON public.modifier_groups FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_groups.business_id));

CREATE POLICY "Users can update their own details" 
    ON public.modifier_groups FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_groups.business_id));

CREATE POLICY "Users can delete their own details" 
    ON public.modifier_groups FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = modifier_groups.business_id));
