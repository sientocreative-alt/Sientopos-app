-- Ensure Super Admin can manage everything
-- Based on AuthContext.jsx, role is checked in user_metadata or app_metadata

-- Policy for businesses table
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admins can manage all businesses" ON public.businesses;
CREATE POLICY "Super Admins can manage all businesses"
ON public.businesses
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
);

-- Policy for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Super Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
);

-- Policy for pos_settings table
ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admins can manage all pos_settings" ON public.pos_settings;
CREATE POLICY "Super Admins can manage all pos_settings"
ON public.pos_settings
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
);
