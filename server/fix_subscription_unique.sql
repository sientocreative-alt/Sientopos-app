-- Add unique constraint to subscriptions table for business_id
-- This is required for upsert operation to work correctly
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_business_id_key UNIQUE (business_id);
