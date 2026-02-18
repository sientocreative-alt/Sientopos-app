
-- Enable RLS on businesses just in case
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Allow Super Admins to SELECT all businesses
CREATE POLICY "Super Admins can view all businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR 
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

-- Note: The 'admin' check in app_metadata is included because sometimes Supabase/GoTrue sets role there. 
-- But our custom logic puts it in user_metadata usually. 
-- The safest bet is checking user_metadata ->> 'role' = 'super_admin'.

-- Also need to allow viewing profiles for the Owner details
CREATE POLICY "Super Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR 
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

-- Update existing user to be super admin if needed (Forcing the specific user email)
-- This is a bit of a hack for the migration, but ensures the CURRENT user can test it if they are the one.
-- Replace with actual update if we could, but we can't easily update auth.users from here without special privileges usually.
-- However, we can update the 'profiles' table if we used that for checks. 
-- But we decided to use JWT metadata in the policy above. 
-- To make the CURRENT user a super admin, they need to sign out and sign back in AFTER their metadata is updated, 
-- OR we can add a policy that checks the specific email for now.

CREATE POLICY "Specific Super Admin Email can view all"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  auth.email() = 'tolgacapaci91@gmail.com' 
);

CREATE POLICY "Specific Super Admin Email can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.email() = 'tolgacapaci91@gmail.com'
);

-- Allow Super Admins to UPDATE businesses (for suspend/activate)
CREATE POLICY "Super Admins can update businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR auth.email() = 'tolgacapaci91@gmail.com'
);
