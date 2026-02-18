-- Create stock_categories table
CREATE TABLE IF NOT EXISTS public.stock_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.stock_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for own business" ON public.stock_categories
    FOR SELECT USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable insert access for own business" ON public.stock_categories
    FOR INSERT WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable update access for own business" ON public.stock_categories
    FOR UPDATE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Enable delete access for own business" ON public.stock_categories
    FOR DELETE USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.stock_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
