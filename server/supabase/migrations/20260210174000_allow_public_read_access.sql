-- Allow public read access to happy_hours
DROP POLICY IF EXISTS "Public read access for happy_hours" ON public.happy_hours;
CREATE POLICY "Public read access for happy_hours"
ON public.happy_hours FOR SELECT
TO public, anon
USING (is_active = true AND is_deleted = false);

-- Allow public read access to campaigns
DROP POLICY IF EXISTS "Public read access for campaigns" ON public.campaigns;
CREATE POLICY "Public read access for campaigns"
ON public.campaigns FOR SELECT
TO public, anon
USING (is_active = true AND is_deleted = false);
