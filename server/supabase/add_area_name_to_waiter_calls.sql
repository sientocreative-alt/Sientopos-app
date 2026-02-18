-- Add area_name column to waiter_calls table
ALTER TABLE public.waiter_calls 
ADD COLUMN IF NOT EXISTS area_name TEXT;

-- Update comment
COMMENT ON COLUMN waiter_calls.area_name IS 'Name of the seating area where the call originated';
