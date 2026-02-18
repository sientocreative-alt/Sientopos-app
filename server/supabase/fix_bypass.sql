CREATE OR REPLACE FUNCTION public.create_user_bypass(
    email TEXT,
    password TEXT,
    user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
BEGIN
    encrypted_pw := crypt(password, gen_salt('bf'));
    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', email, encrypted_pw, NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb, user_metadata, NOW(), NOW(),
        '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, format('{"sub": "%s", "email": "%s"}', new_user_id, email)::jsonb, 'email', new_user_id::text, NOW(), NOW(), NOW()
    );

    RETURN new_user_id;
END;
$$;
