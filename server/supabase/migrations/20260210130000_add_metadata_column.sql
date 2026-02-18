ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
