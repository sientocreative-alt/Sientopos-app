-- Add session tracking columns to tables
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_total DECIMAL(10,2) DEFAULT 0;

-- Update existing tables (just in case)
UPDATE tables SET is_occupied = false WHERE is_occupied IS NULL;
UPDATE tables SET current_total = 0 WHERE current_total IS NULL;
