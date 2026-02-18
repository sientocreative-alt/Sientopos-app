-- Allow Super Admins to view all pos_settings
CREATE POLICY "Super Admins can view all pos_settings"
ON public.pos_settings
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);
