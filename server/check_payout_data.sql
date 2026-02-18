-- Check if table has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reseller_payout_requests';

-- Check for existing policies
SELECT * FROM pg_policies WHERE tablename = 'reseller_payout_requests';

-- Check data count
SELECT count(*) FROM reseller_payout_requests;

-- Check sample data
SELECT * FROM reseller_payout_requests LIMIT 5;
