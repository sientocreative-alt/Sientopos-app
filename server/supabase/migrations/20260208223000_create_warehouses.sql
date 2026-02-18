-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    name TEXT NOT NULL,
    is_sales_warehouse BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for own business" ON public.warehouses
    FOR SELECT USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable insert access for own business" ON public.warehouses
    FOR INSERT WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable update access for own business" ON public.warehouses
    FOR UPDATE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable delete access for own business" ON public.warehouses
    FOR DELETE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.warehouses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
