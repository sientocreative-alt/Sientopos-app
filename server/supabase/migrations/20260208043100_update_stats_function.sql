-- Update get_business_stats to include status and return gift/waste items
DROP FUNCTION IF EXISTS get_business_stats(UUID, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION get_business_stats(p_business_id UUID, p_start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    created_at TIMESTAMP WITH TIME ZONE,
    price DECIMAL,
    quantity INTEGER,
    modifiers JSONB,
    payment_type TEXT,
    status TEXT
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
        oi.payment_type,
        oi.status
    FROM order_items oi
    WHERE oi.business_id = p_business_id
    AND oi.is_deleted = false
    AND oi.status IN ('paid', 'gift', 'waste')
    AND oi.created_at >= p_start_date;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_business_stats(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_stats(UUID, TIMESTAMP WITH TIME ZONE) TO service_role;
