-- Create staff_break_rules table
CREATE TABLE IF NOT EXISTS public.staff_break_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    min_work_hours DECIMAL NOT NULL,
    max_work_hours DECIMAL NOT NULL,
    break_minutes INTEGER NOT NULL,
    max_break_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS
ALTER TABLE public.staff_break_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business break rules"
    ON public.staff_break_rules FOR SELECT
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert their own business break rules"
    ON public.staff_break_rules FOR INSERT
    WITH CHECK (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own business break rules"
    ON public.staff_break_rules FOR UPDATE
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete their own business break rules"
    ON public.staff_break_rules FOR DELETE
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_break_rules
BEFORE UPDATE ON public.staff_break_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
