-- Create stock_units table
CREATE TABLE IF NOT EXISTS public.stock_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Ağırlık', 'Hacim', 'Uzunluk', 'Parça'
    ratio NUMERIC DEFAULT 1 NOT NULL,
    base_unit_id UUID REFERENCES public.stock_units(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.stock_units ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for own business" ON public.stock_units
    FOR SELECT USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable insert access for own business" ON public.stock_units
    FOR INSERT WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable update access for own business" ON public.stock_units
    FOR UPDATE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable delete access for own business" ON public.stock_units
    FOR DELETE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.stock_units
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
