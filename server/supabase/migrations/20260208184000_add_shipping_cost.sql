-- Add shipping_cost to supplier_transactions
ALTER TABLE public.supplier_transactions 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(12,2) DEFAULT 0;
