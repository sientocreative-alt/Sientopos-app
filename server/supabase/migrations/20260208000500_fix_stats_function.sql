
-- Drop old function if exists (to be clean)
DROP FUNCTION IF EXISTS get_monthly_paid_items(UUID, TIMESTAMP WITH TIME ZONE);

-- Create new function with a distinct name
CREATE OR REPLACE FUNCTION get_business_stats(p_business_id UUID, p_start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    created_at TIMESTAMP WITH TIME ZONE,
    price DECIMAL,
    quantity INTEGER,
    modifiers JSONB
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
        oi.modifiers
    FROM order_items oi
    WHERE oi.business_id = p_business_id
    AND oi.status = 'paid'
    -- Soft delete doesn't matter here because we are selecting directly, 
    -- BUT if RLS policies on the TABLE still apply to the function owner (postgres/service role?),
    -- usually SECURITY DEFINER bypasses RLS for the table if the owner has bypassrls or is superuser.
    -- However, let's be explicit:
    -- If using Supabase, `postgres` role usually bypasses RLS.
    AND oi.created_at >= p_start_date;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION get_business_stats(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_stats(UUID, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION get_business_stats(UUID, TIMESTAMP WITH TIME ZONE) TO anon; -- Just in case testing
