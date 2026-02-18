
-- Function to fetch paid items for statistics, bypassing RLS
-- This allows us to see "is_deleted=true" items which are archived after payment.

CREATE OR REPLACE FUNCTION get_monthly_paid_items(p_business_id UUID, p_start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    created_at TIMESTAMP WITH TIME ZONE,
    price DECIMAL,
    quantity INTEGER,
    modifiers JSONB
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.created_at,
        oi.price,
        oi.quantity,
        oi.modifiers
    FROM order_items oi
    WHERE oi.business_id = p_business_id
    AND oi.status = 'paid'
    AND oi.created_at >= p_start_date;
END;
$$ LANGUAGE plpgsql;
