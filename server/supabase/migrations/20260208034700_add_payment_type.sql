-- Add payment_type column to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- Drop old function because return type changed (adding payment_type)
DROP FUNCTION IF EXISTS get_business_stats(UUID, TIMESTAMP WITH TIME ZONE);

-- Update get_business_stats to return payment_type
CREATE OR REPLACE FUNCTION get_business_stats(p_business_id UUID, p_start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    created_at TIMESTAMP WITH TIME ZONE,
    price DECIMAL,
    quantity INTEGER,
    modifiers JSONB,
    payment_type TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.created_at,
        oi.price,
        oi.quantity,
        oi.modifiers,
        oi.payment_type
    FROM order_items oi
    WHERE oi.business_id = p_business_id
    AND oi.status = 'paid'
    AND oi.created_at >= p_start_date;
END;
$$ LANGUAGE plpgsql;
