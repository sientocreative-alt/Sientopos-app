-- Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can view faqs" ON public.faqs;
CREATE POLICY "Public can view faqs"
ON public.faqs FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Super Admins can manage faqs" ON public.faqs;
CREATE POLICY "Super Admins can manage faqs"
ON public.faqs FOR ALL
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

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.faqs;
