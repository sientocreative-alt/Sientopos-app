-- Create resellers table if not exists (just in case)
CREATE TABLE IF NOT EXISTS resellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    commission_rate NUMERIC DEFAULT 15.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reseller_commissions table
CREATE TABLE IF NOT EXISTS reseller_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    base_amount NUMERIC NOT NULL,
    commission_rate NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, cancelled
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reseller_commissions_reseller_id ON reseller_commissions(reseller_id);
