-- Create staff table for POS management
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    web_password TEXT,
    
    restaurant_role TEXT DEFAULT 'Personel', -- Options: Personel, Kurye
    staff_role TEXT, -- Options: Yönetici, Barista, Garson, Muhasebe Denetçisi, Stok Denetçisi, Kasiyer, Mesai, Şef, Nargileci, Müdür
    
    hire_date DATE DEFAULT CURRENT_DATE,
    total_break_time INTEGER DEFAULT 0, -- In minutes
    pin_code TEXT,
    daily_free_drink_limit INTEGER DEFAULT 0,
    shift_active BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    auth_user_id UUID REFERENCES auth.users(id),
    
    -- Ensure same email isn't used twice in the same business
    CONSTRAINT unique_staff_email_per_business UNIQUE (business_id, email)
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view staff in their business" ON public.staff;
CREATE POLICY "Users can view staff in their business" 
    ON public.staff FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = staff.business_id));

DROP POLICY IF EXISTS "Users can manage staff in their business" ON public.staff;
CREATE POLICY "Users can manage staff in their business" 
    ON public.staff FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = staff.business_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
