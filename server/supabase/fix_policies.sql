-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;

-- DROP existing potentially conflicting policies
DROP POLICY IF EXISTS "Super Admins can manage all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Super Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can manage all pos_settings" ON public.pos_settings;

-- Create ALL bypass policies for Super Admin
CREATE POLICY "Super Admins can manage all businesses" ON public.businesses FOR ALL TO authenticated 
USING ( (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') )
WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') );

CREATE POLICY "Super Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated 
USING ( (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') )
WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') );

CREATE POLICY "Super Admins can manage all pos_settings" ON public.pos_settings FOR ALL TO authenticated 
USING ( (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') )
WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') );
