-- Create stock_entries table
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES public.pos_settings(business_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    unit_id UUID REFERENCES public.stock_units(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    brand TEXT,
    invoice_no TEXT,
    description TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for own business"
ON public.stock_entries FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for own business"
ON public.stock_entries FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for own business"
ON public.stock_entries FOR UPDATE
USING (auth.role() = 'authenticated');

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at_stock_entries()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_stock_entries_updated_at
    BEFORE UPDATE ON public.stock_entries
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at_stock_entries();
