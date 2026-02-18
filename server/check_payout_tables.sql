SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('reseller_payout_requests', 'reseller_bank_accounts');
