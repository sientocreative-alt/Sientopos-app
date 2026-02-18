-- Create predefined_notes table
CREATE TABLE IF NOT EXISTS public.predefined_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.predefined_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own predefined notes" 
    ON public.predefined_notes FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = predefined_notes.business_id));

CREATE POLICY "Users can insert their own predefined notes" 
    ON public.predefined_notes FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = predefined_notes.business_id));

CREATE POLICY "Users can update their own predefined notes" 
    ON public.predefined_notes FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = predefined_notes.business_id));

CREATE POLICY "Users can delete their own predefined notes" 
    ON public.predefined_notes FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = predefined_notes.business_id));
