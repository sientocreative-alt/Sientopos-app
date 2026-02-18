-- 1. Payment Logs Table (Webhooks & Errors)
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'subscription.renewed', 'error', etc.
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Update Subscription Plans (Add generic external id just in case, but usually mapped via code or meta)
-- Iyzico requires a "Product Reference" and "Pricing Plan Reference".
-- PayTR doesn't really have "Plans" in the same way (just amount), but we might map it.
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS external_product_id TEXT, -- Iyzico Product Code
ADD COLUMN IF NOT EXISTS external_plan_id_monthly TEXT, -- Iyzico Pricing Plan Code (Monthly)
ADD COLUMN IF NOT EXISTS external_plan_id_yearly TEXT; -- Iyzico Pricing Plan Code (Yearly)

-- 3. Update Subscriptions (Generic Fields)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'iyzico', -- 'iyzico', 'paytr'
ADD COLUMN IF NOT EXISTS subscription_id TEXT, -- External Subscription ID (ReferenceCode)
ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMP WITH TIME ZONE; -- Next payment date

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_sub_id ON subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions(provider);
