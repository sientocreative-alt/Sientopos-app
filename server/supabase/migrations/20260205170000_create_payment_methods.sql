-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    show_change_calculator BOOLEAN DEFAULT false,
    open_cash_drawer BOOLEAN DEFAULT false,
    print_receipt BOOLEAN DEFAULT false,
    pos_type TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own payment methods" 
    ON public.payment_methods FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = payment_methods.business_id));

CREATE POLICY "Users can insert their own payment methods" 
    ON public.payment_methods FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = payment_methods.business_id));

CREATE POLICY "Users can update their own payment methods" 
    ON public.payment_methods FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = payment_methods.business_id));

CREATE POLICY "Users can delete their own payment methods" 
    ON public.payment_methods FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = payment_methods.business_id))
    WITH CHECK (is_deleted = true);
