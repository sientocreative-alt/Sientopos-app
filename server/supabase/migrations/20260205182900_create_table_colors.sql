-- Create table_colors table
CREATE TABLE IF NOT EXISTS public.table_colors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    color_hex TEXT NOT NULL,
    start_minute INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.table_colors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own table colors" 
    ON public.table_colors FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = table_colors.business_id));

CREATE POLICY "Users can insert their own table colors" 
    ON public.table_colors FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = table_colors.business_id));

CREATE POLICY "Users can update their own table colors" 
    ON public.table_colors FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = table_colors.business_id));

CREATE POLICY "Users can delete their own table colors" 
    ON public.table_colors FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = table_colors.business_id));
