-- Function to manually create a user in auth.users
-- This bypasses the API rate limits for admin operations
CREATE OR REPLACE FUNCTION public.create_user_bypass(
    email TEXT,
    password TEXT,
    user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
BEGIN
    -- Hash the password using pgcrypto (Supabase uses bcrypt)
    encrypted_pw := crypt(password, gen_salt('bf'));

    -- Generate a new UUID
    new_user_id := gen_random_uuid();

    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Default instance_id
        new_user_id,
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        NOW(), -- Auto-confirm
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        user_metadata,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Insert into auth.identities (Required for Supabase Auth to work consistently)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id, -- Added this
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        format('{"sub": "%s", "email": "%s"}', new_user_id, email)::jsonb,
        'email',
        new_user_id::text, -- user_id as text is used for provider_id in email provider
        NOW(),
        NOW(),
        NOW()
    );

    RETURN new_user_id;
END;
$$;
