-- Update create_business_complete to support country and reseller_id
CREATE OR REPLACE FUNCTION public.create_business_complete(
    p_email TEXT,
    p_password TEXT,
    p_owner_name TEXT,
    p_business_name TEXT,
    p_phone TEXT,
    p_tax_office TEXT,
    p_tax_number TEXT,
    p_billing_type TEXT DEFAULT NULL,
    p_company_type TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_tax_plate_url TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_reseller_id UUID DEFAULT NULL,
    p_country TEXT DEFAULT 'Türkiye' -- Added parameter
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    new_business_id UUID;
    encrypted_pw TEXT;
    v_now TIMESTAMPTZ := NOW();
    v_trial_end TIMESTAMPTZ := NOW() + INTERVAL '15 days';
BEGIN
    -- Check if user already exists
    SELECT id INTO new_user_id FROM auth.users WHERE email = p_email;

    IF new_user_id IS NOT NULL THEN
        -- Check if they have a profile
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Bu e-posta adresi zaten kayıtlı.'
            );
        ELSE
            -- No profile? Clean up the orphaned auth user to retry
            DELETE FROM auth.identities WHERE user_id = new_user_id;
            DELETE FROM auth.users WHERE id = new_user_id;
            new_user_id := NULL;
        END IF;
    END IF;

    -- 1. Create Auth User
    encrypted_pw := crypt(p_password, gen_salt('bf'));
    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
        p_email, encrypted_pw, v_now,
        '{"provider": "email", "providers": ["email"]}'::jsonb, 
        format('{"full_name": "%s", "role": "admin"}', p_owner_name)::jsonb, 
        v_now, v_now, '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, format('{"sub": "%s", "email": "%s"}', new_user_id, p_email)::jsonb, 
        'email', new_user_id::text, v_now, v_now, v_now
    );

    -- 2. Create Business
    INSERT INTO public.businesses (
        name, status, subscription_plan, trial_start_date, trial_end_date, created_at, reseller_id
    ) VALUES (
        p_business_name, 'trial', 'trial', v_now, v_trial_end, v_now, p_reseller_id
    ) RETURNING id INTO new_business_id;

    -- 3. Create Profile
    INSERT INTO public.profiles (
        id, business_id, full_name, role, created_at
    ) VALUES (
        new_user_id, new_business_id, p_owner_name, 'admin', v_now
    )
    ON CONFLICT (id) DO UPDATE SET
        business_id = EXCLUDED.business_id,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    -- 4. Create POS Settings
    INSERT INTO public.pos_settings (
        business_id, full_name, tax_office, tax_number, 
        contact_email, contact_phone, tax_plate_url,
        billing_type, company_type, address,
        country, city, district, -- Added country column
        business_display_name,
        created_at
    ) VALUES (
        new_business_id, p_owner_name, p_tax_office, p_tax_number, 
        p_email, p_phone, p_tax_plate_url,
        p_billing_type, p_company_type, p_address,
        p_country, p_city, p_district, -- Used p_country parameter
        p_business_name,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'business_id', new_business_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
