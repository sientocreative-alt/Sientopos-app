-- Add paid_at, staff_name and paid_by_name to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS staff_name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS paid_by_name TEXT;

-- Update existing paid items to have a paid_at if they don't (using created_at as fallback)
UPDATE public.order_items SET paid_at = created_at WHERE status = 'paid' AND paid_at IS NULL;
