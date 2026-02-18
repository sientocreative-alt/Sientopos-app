-- Add campaign field to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS yearly_campaign_active BOOLEAN DEFAULT FALSE;
