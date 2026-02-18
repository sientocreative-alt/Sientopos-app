-- Create targets table
CREATE TABLE IF NOT EXISTS public.targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    target_type TEXT NOT NULL, -- 'product', 'category', 'payment_type'
    target_scope_id UUID, -- ID of product or category (null for payment_type if needed)
    target_scope_name TEXT, -- Visual display name
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    staff_ids UUID[] DEFAULT '{}', -- Array of staff IDs the target applies to
    
    steps JSONB NOT NULL DEFAULT '[]', -- Array of {min, max, reward}
    
    status TEXT DEFAULT 'active', -- 'active', 'completed'
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view targets in their business" ON public.targets;
CREATE POLICY "Users can view targets in their business" 
    ON public.targets FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = targets.business_id));

DROP POLICY IF EXISTS "Users can manage staff in their business" ON public.targets;
DROP POLICY IF EXISTS "Users can manage targets in their business" ON public.targets;
CREATE POLICY "Users can manage targets in their business" 
    ON public.targets FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = targets.business_id));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_targets_updated_at ON public.targets;
CREATE TRIGGER update_targets_updated_at
    BEFORE UPDATE ON public.targets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
