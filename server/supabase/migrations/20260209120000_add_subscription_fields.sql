-- Add subscription and status fields to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS trial_start_date DATE,
ADD COLUMN IF NOT EXISTS trial_end_date DATE,
ADD COLUMN IF NOT EXISTS subscription_start_date DATE,
ADD COLUMN IF NOT EXISTS subscription_end_date DATE,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended'));
