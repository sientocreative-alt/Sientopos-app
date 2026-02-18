-- Create terminals table
CREATE TABLE IF NOT EXISTS public.terminals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Personel Adı
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    terminal_type TEXT NOT NULL,
    printer_service TEXT,
    pos_service TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;

-- Policies matching devices and printers pattern
CREATE POLICY "Users can view their own terminals" 
    ON public.terminals FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = terminals.business_id));

CREATE POLICY "Users can insert their own terminals" 
    ON public.terminals FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = terminals.business_id));

CREATE POLICY "Users can update their own terminals" 
    ON public.terminals FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = terminals.business_id));

CREATE POLICY "Users can delete their own terminals" 
    ON public.terminals FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = terminals.business_id));
