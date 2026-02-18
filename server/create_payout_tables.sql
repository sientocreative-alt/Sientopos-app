-- Create reseller_bank_accounts table
CREATE TABLE IF NOT EXISTS reseller_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    iban TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reseller_payout_requests table
CREATE TABLE IF NOT EXISTS reseller_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES reseller_bank_accounts(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_reseller_id ON reseller_payout_requests(reseller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON reseller_payout_requests(status);
