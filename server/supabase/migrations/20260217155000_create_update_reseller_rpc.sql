-- RPC: update_reseller_complete to handle User and Reseller updates (including password)
CREATE OR REPLACE FUNCTION public.update_reseller_complete(
    p_id UUID,
    p_company_name TEXT,
    p_establishment_year INTEGER DEFAULT NULL,
    p_tax_office TEXT DEFAULT NULL,
    p_tax_number TEXT DEFAULT NULL,
    p_main_contact_name TEXT DEFAULT NULL,
    p_main_contact_role TEXT DEFAULT NULL,
    p_main_contact_phone TEXT DEFAULT NULL,
    p_secondary_contact_name TEXT DEFAULT NULL,
    p_secondary_contact_role TEXT DEFAULT NULL,
    p_secondary_contact_phone TEXT DEFAULT NULL,
    p_country TEXT DEFAULT 'Türkiye',
    p_city TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_office_size INTEGER DEFAULT NULL,
    p_employee_count INTEGER DEFAULT NULL,
    p_branch_info TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_other_reseller TEXT DEFAULT NULL,
    p_reseller_code TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'active',
    p_commission_rate DECIMAL DEFAULT 15.00,
    p_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Update auth.users if email or password provided
    -- Note: Updating email might require special handling if email confirmation is on, 
    -- but for this POS system we assume admin direct update.
    UPDATE auth.users 
    SET 
        email = COALESCE(p_email, email),
        encrypted_password = CASE WHEN p_password IS NOT NULL AND p_password <> '' THEN crypt(p_password, gen_salt('bf')) ELSE encrypted_password END,
        updated_at = v_now
    WHERE id = p_id;

    -- 2. Update resellers table
    UPDATE public.resellers
    SET
        company_name = p_company_name,
        establishment_year = p_establishment_year,
        tax_office = p_tax_office,
        tax_number = p_tax_number,
        main_contact_name = p_main_contact_name,
        main_contact_role = p_main_contact_role,
        main_contact_phone = p_main_contact_phone,
        secondary_contact_name = p_secondary_contact_name,
        secondary_contact_role = p_secondary_contact_role,
        secondary_contact_phone = p_secondary_contact_phone,
        country = p_country,
        city = p_city,
        district = p_district,
        address = p_address,
        phone = p_phone,
        email = p_email,
        office_size = p_office_size,
        employee_count = p_employee_count,
        branch_info = p_branch_info,
        website = p_website,
        other_reseller = p_other_reseller,
        reseller_code = p_reseller_code,
        username = p_username,
        status = p_status,
        commission_rate = p_commission_rate,
        updated_at = v_now
    WHERE id = p_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
