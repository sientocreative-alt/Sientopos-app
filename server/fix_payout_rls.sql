-- Enable RLS (good practice to be explicit)
ALTER TABLE reseller_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON reseller_payout_requests;
DROP POLICY IF EXISTS "Enable insert for all users" ON reseller_payout_requests;
DROP POLICY IF EXISTS "Enable update for all users" ON reseller_payout_requests;

DROP POLICY IF EXISTS "Enable read access for all users" ON reseller_bank_accounts;
DROP POLICY IF EXISTS "Enable insert for all users" ON reseller_bank_accounts;
DROP POLICY IF EXISTS "Enable delete for all users" ON reseller_bank_accounts;

-- Create permissive policies for now (Refine later for distinct Admin vs Reseller roles)
CREATE POLICY "Enable read access for all users" ON reseller_payout_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON reseller_payout_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON reseller_payout_requests FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON reseller_bank_accounts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON reseller_bank_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON reseller_bank_accounts FOR DELETE USING (true);
