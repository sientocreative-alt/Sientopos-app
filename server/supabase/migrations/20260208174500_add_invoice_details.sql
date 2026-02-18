-- Add detailed fields to supplier_transactions for expense invoices
ALTER TABLE public.supplier_transactions 
ADD COLUMN IF NOT EXISTS record_type TEXT,
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sct_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.supplier_transactions.credit IS 'Total invoice amount (the amount the business owes the supplier)';
COMMENT ON COLUMN public.supplier_transactions.debt IS 'Total payment amount (the amount the business paid to the supplier)';
