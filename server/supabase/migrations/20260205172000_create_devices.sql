-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT, -- Android, iOS, Windows, Web
    terminal_type TEXT, -- El Terminali, Kiosk, Tablet, PC
    device_id TEXT, -- Hardware ID
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own devices" 
    ON public.devices FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = devices.business_id));

CREATE POLICY "Users can insert their own devices" 
    ON public.devices FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = devices.business_id));

CREATE POLICY "Users can update their own devices" 
    ON public.devices FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = devices.business_id));

CREATE POLICY "Users can delete their own devices" 
    ON public.devices FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = devices.business_id))
    WITH CHECK (is_deleted = true);
