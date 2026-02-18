
-- Force update all businesses to active status, handling NULLs explicitly
UPDATE public.businesses
SET status = 'active'
WHERE status IS NULL OR status = 'trial';

-- Also ensure subscription_plan has a default
UPDATE public.businesses
SET subscription_plan = 'monthly'
WHERE subscription_plan IS NULL;
