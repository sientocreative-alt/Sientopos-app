-- Delete the user from auth.users to reset the registration state
-- This allows the user to sign up again with the same email immediately.
DELETE FROM auth.users WHERE email = 'caddegarageworks@gmail.com';
