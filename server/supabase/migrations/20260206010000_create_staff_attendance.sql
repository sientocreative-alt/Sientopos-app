-- Create staff_attendance table
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    total_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business attendance records"
    ON public.staff_attendance FOR SELECT
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert their own business attendance records"
    ON public.staff_attendance FOR INSERT
    WITH CHECK (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own business attendance records"
    ON public.staff_attendance FOR UPDATE
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete their own business attendance records"
    ON public.staff_attendance FOR DELETE
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_attendance
BEFORE UPDATE ON public.staff_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
