-- Drop incorrect policies
DROP POLICY IF EXISTS "Users can view their own printers" ON public.printers;
DROP POLICY IF EXISTS "Users can insert their own printers" ON public.printers;
DROP POLICY IF EXISTS "Users can update their own printers" ON public.printers;
DROP POLICY IF EXISTS "Users can delete their own printers" ON public.printers;

-- Create correct policies matching devices table pattern
CREATE POLICY "Users can view their own printers" 
    ON public.printers FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = printers.business_id));

CREATE POLICY "Users can insert their own printers" 
    ON public.printers FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = printers.business_id));

CREATE POLICY "Users can update their own printers" 
    ON public.printers FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = printers.business_id));

CREATE POLICY "Users can delete their own printers" 
    ON public.printers FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = printers.business_id));
