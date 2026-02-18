-- Link businesses to resellers
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id);

-- Create business logs table to track administrative actions
CREATE TABLE IF NOT EXISTS public.business_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'STATUS_CHANGE', 'PLAN_UPDATE', 'CREATED'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on business_logs
ALTER TABLE public.business_logs ENABLE ROW LEVEL SECURITY;

-- Policies for businesses (update existing ones to account for reseller_id)
DROP POLICY IF EXISTS "Reseller access to own businesses" ON public.businesses;
CREATE POLICY "Reseller access to own businesses" ON public.businesses
    FOR ALL
    USING (reseller_id = auth.uid())
    WITH CHECK (reseller_id = auth.uid());

-- Policies for business_logs
DROP POLICY IF EXISTS "Resellers see logs of their businesses" ON public.business_logs;
CREATE POLICY "Resellers see logs of their businesses" ON public.business_logs
    FOR SELECT
    USING (business_id IN (SELECT id FROM public.businesses WHERE reseller_id = auth.uid()));

CREATE POLICY "Resellers can insert logs for their businesses" ON public.business_logs
    FOR INSERT
    WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE reseller_id = auth.uid()));
