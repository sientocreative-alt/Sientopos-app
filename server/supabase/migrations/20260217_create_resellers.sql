-- Create resellers table with full set of fields
CREATE TABLE IF NOT EXISTS resellers (
    id UUID PRIMARY KEY, -- Will match auth.users ID
    company_name TEXT NOT NULL,
    establishment_year INTEGER,
    tax_office TEXT,
    tax_number TEXT,
    main_contact_name TEXT,
    main_contact_role TEXT,
    main_contact_phone TEXT,
    secondary_contact_name TEXT,
    secondary_contact_role TEXT,
    secondary_contact_phone TEXT,
    country TEXT DEFAULT 'Türkiye',
    city TEXT,
    district TEXT,
    address TEXT,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    office_size INTEGER,
    employee_count INTEGER,
    branch_info TEXT,
    website TEXT,
    other_reseller TEXT,
    reseller_code TEXT UNIQUE,
    username TEXT UNIQUE,
    privacy_acknowledgment BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Handle already existing tables and add columns if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='company_name') THEN
        ALTER TABLE public.resellers ADD COLUMN company_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='establishment_year') THEN
        ALTER TABLE public.resellers ADD COLUMN establishment_year INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='tax_office') THEN
        ALTER TABLE public.resellers ADD COLUMN tax_office TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='tax_number') THEN
        ALTER TABLE public.resellers ADD COLUMN tax_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='main_contact_name') THEN
        ALTER TABLE public.resellers ADD COLUMN main_contact_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='main_contact_role') THEN
        ALTER TABLE public.resellers ADD COLUMN main_contact_role TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='main_contact_phone') THEN
        ALTER TABLE public.resellers ADD COLUMN main_contact_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='secondary_contact_name') THEN
        ALTER TABLE public.resellers ADD COLUMN secondary_contact_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='secondary_contact_role') THEN
        ALTER TABLE public.resellers ADD COLUMN secondary_contact_role TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='secondary_contact_phone') THEN
        ALTER TABLE public.resellers ADD COLUMN secondary_contact_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='country') THEN
        ALTER TABLE public.resellers ADD COLUMN country TEXT DEFAULT 'Türkiye';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='city') THEN
        ALTER TABLE public.resellers ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='district') THEN
        ALTER TABLE public.resellers ADD COLUMN district TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='address') THEN
        ALTER TABLE public.resellers ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='office_size') THEN
        ALTER TABLE public.resellers ADD COLUMN office_size INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='employee_count') THEN
        ALTER TABLE public.resellers ADD COLUMN employee_count INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='branch_info') THEN
        ALTER TABLE public.resellers ADD COLUMN branch_info TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='website') THEN
        ALTER TABLE public.resellers ADD COLUMN website TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='other_reseller') THEN
        ALTER TABLE public.resellers ADD COLUMN other_reseller TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resellers' AND column_name='username') THEN
        ALTER TABLE public.resellers ADD COLUMN username TEXT UNIQUE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

-- Simple policies
DROP POLICY IF EXISTS "Allow authenticated users to read resellers" ON resellers;
CREATE POLICY "Allow authenticated users to read resellers" ON resellers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert resellers" ON resellers;
CREATE POLICY "Allow authenticated users to insert resellers" ON resellers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update resellers" ON resellers;
CREATE POLICY "Allow authenticated users to update resellers" ON resellers
    FOR UPDATE USING (true);

-- RPC: create_reseller_complete to handle User and Reseller record in one shot
CREATE OR REPLACE FUNCTION public.create_reseller_complete(
    p_company_name TEXT,
    p_email TEXT,
    p_password TEXT,
    p_phone TEXT DEFAULT NULL,
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
    p_office_size INTEGER DEFAULT NULL,
    p_employee_count INTEGER DEFAULT NULL,
    p_branch_info TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_other_reseller TEXT DEFAULT NULL,
    p_reseller_code TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_privacy_acknowledgment BOOLEAN DEFAULT FALSE,
    p_commission_rate DECIMAL DEFAULT 15.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bu e-posta adresi zaten kayıtlı.'
        );
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
        jsonb_build_object('full_name', p_main_contact_name, 'role', 'reseller'), 
        v_now, v_now, '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', p_email), 
        'email', new_user_id::text, v_now, v_now, v_now
    );

    -- 2. Create Reseller Record
    INSERT INTO public.resellers (
        id, company_name, email, phone, establishment_year, tax_office, tax_number,
        main_contact_name, main_contact_role, main_contact_phone,
        secondary_contact_name, secondary_contact_role, secondary_contact_phone,
        country, city, district, address, office_size, employee_count,
        branch_info, website, other_reseller, reseller_code, username, privacy_acknowledgment,
        status, commission_rate, created_at, updated_at
    ) VALUES (
        new_user_id, p_company_name, p_email, p_phone, p_establishment_year, p_tax_office, p_tax_number,
        p_main_contact_name, p_main_contact_role, p_main_contact_phone,
        p_secondary_contact_name, p_secondary_contact_role, p_secondary_contact_phone,
        p_country, p_city, p_district, p_address, p_office_size, p_employee_count,
        p_branch_info, p_website, p_other_reseller, p_reseller_code, p_username, p_privacy_acknowledgment,
        'active', p_commission_rate, v_now, v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'reseller_id', new_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
