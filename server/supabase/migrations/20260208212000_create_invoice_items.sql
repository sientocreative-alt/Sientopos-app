-- Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity DECIMAL(12,2) DEFAULT 0,
    unit TEXT, -- Adet, Kg, Lt, vb.
    unit_price_excl_vat DECIMAL(12,2) DEFAULT 0, -- KDV Hariç Birim Fiyat
    
    tax_otv_rate DECIMAL(5,2) DEFAULT 0,
    tax_otv_amount DECIMAL(12,2) DEFAULT 0,
    
    tax_kdv_rate DECIMAL(5,2) DEFAULT 0,
    tax_kdv_amount DECIMAL(12,2) DEFAULT 0,
    
    discount_rate DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    
    total_amount DECIMAL(12,2) DEFAULT 0, -- Satır toplamı (Vergiler/İndirimler dahil)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies (inherit access from invoice -> business)
-- Ideally we check if the user has access to the invoice's business_id.
-- A simple way is to check if the invoice belongs to a business the user has access to.
-- Using a subquery for policies.

DROP POLICY IF EXISTS "Enable read access for business users" ON public.invoice_items;
CREATE POLICY "Enable read access for business users" ON public.invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
            AND i.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Enable insert for business users" ON public.invoice_items;
CREATE POLICY "Enable insert for business users" ON public.invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
            AND i.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Enable update for business users" ON public.invoice_items;
CREATE POLICY "Enable update for business users" ON public.invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
            AND i.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Enable delete for business users" ON public.invoice_items;
CREATE POLICY "Enable delete for business users" ON public.invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
            AND i.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);
