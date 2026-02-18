-- Update existing businesses to be 'active' if they are currently 'trial'
UPDATE public.businesses
SET status = 'active'
WHERE status = 'trial' OR status IS NULL;
