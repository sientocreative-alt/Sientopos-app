-- Create payments table for detailed transaction tracking
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    staff_name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    source TEXT DEFAULT 'Kullanıcı',
    unique_id TEXT,
    batch_no TEXT,
    stan TEXT,
    bkm_id TEXT,
    bank_name TEXT,
    auth_code TEXT,
    status TEXT DEFAULT 'success',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment_id to order_items to link multiple items to a single payment record
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage payments in their business" ON public.payments;
CREATE POLICY "Users can manage payments in their business" 
    ON public.payments FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = payments.business_id));
