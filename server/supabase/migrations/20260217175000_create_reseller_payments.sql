-- Create table for reseller bank accounts
CREATE TABLE IF NOT EXISTS public.reseller_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    iban TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for payout requests
CREATE TABLE IF NOT EXISTS public.reseller_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    bank_account_id UUID REFERENCES public.reseller_bank_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.reseller_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_payout_requests ENABLE ROW LEVEL SECURITY;

-- Policies for Bank Accounts
DROP POLICY IF EXISTS "Resellers manage their own bank accounts" ON public.reseller_bank_accounts;
CREATE POLICY "Resellers manage their own bank accounts" ON public.reseller_bank_accounts
    FOR ALL USING (reseller_id = auth.uid());

-- Policies for Payout Requests
DROP POLICY IF EXISTS "Resellers view their own payout requests" ON public.reseller_payout_requests;
CREATE POLICY "Resellers view their own payout requests" ON public.reseller_payout_requests
    FOR SELECT USING (reseller_id = auth.uid());

DROP POLICY IF EXISTS "Resellers insert their own payout requests" ON public.reseller_payout_requests;
CREATE POLICY "Resellers insert their own payout requests" ON public.reseller_payout_requests
    FOR INSERT WITH CHECK (reseller_id = auth.uid());

-- Indexing
CREATE INDEX IF NOT EXISTS idx_reseller_bank_accounts_reseller_id ON public.reseller_bank_accounts(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_payout_requests_reseller_id ON public.reseller_payout_requests(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_payout_requests_status ON public.reseller_payout_requests(status);
