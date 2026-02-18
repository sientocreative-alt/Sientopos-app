-- Add paytr_utoken to businesses if not exists
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS paytr_utoken TEXT;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_oid TEXT UNIQUE NOT NULL,
    business_id UUID REFERENCES businesses(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TL',
    status TEXT DEFAULT 'pending', -- pending, success, failed
    paytr_ref TEXT, -- Reference from PayTR if available
    metadata JSONB, -- Store extra info like ip, email, user_basket
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_merchant_oid ON payment_transactions(merchant_oid);
