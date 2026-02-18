-- Create staff_roles table
CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_role_name_per_business UNIQUE (business_id, role_name)
);

-- Add RLS
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business roles"
    ON public.staff_roles FOR SELECT
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert their own business roles"
    ON public.staff_roles FOR INSERT
    WITH CHECK (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own business roles"
    ON public.staff_roles FOR UPDATE
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete their own business roles"
    ON public.staff_roles FOR DELETE
    USING (business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_roles
BEFORE UPDATE ON public.staff_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
