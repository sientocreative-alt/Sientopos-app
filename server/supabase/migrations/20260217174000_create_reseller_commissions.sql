-- Create reseller_commissions table to track earnings
CREATE TABLE IF NOT EXISTS public.reseller_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    base_amount DECIMAL(10, 2) NOT NULL, -- The original subscription price
    commission_amount DECIMAL(10, 2) NOT NULL, -- Calculated commission (base_amount * commission_rate / 100)
    commission_rate DECIMAL(5, 2) NOT NULL, -- Snapshot of the rate at the time of calculation
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    payout_id TEXT, -- Reference to the platform's payout transaction
    invoice_url TEXT, -- Link to the commission invoice if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.reseller_commissions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Resellers can view their own commissions" ON public.reseller_commissions;
CREATE POLICY "Resellers can view their own commissions" ON public.reseller_commissions
    FOR SELECT
    USING (reseller_id = auth.uid());

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_reseller_commissions_reseller_id ON public.reseller_commissions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_commissions_status ON public.reseller_commissions(status);
