-- Create staff_shifts table
CREATE TABLE IF NOT EXISTS public.staff_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTERVAL DEFAULT '0 minutes',
    total_hours DECIMAL(5,2), -- Calculated field
    
    UNIQUE(staff_id, date) -- One shift per person per day for simplicity in the weekly grid
);

-- Enable RLS
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view staff_shifts in their business" ON public.staff_shifts;
CREATE POLICY "Users can view staff_shifts in their business" 
    ON public.staff_shifts FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = staff_shifts.business_id));

DROP POLICY IF EXISTS "Users can manage staff_shifts in their business" ON public.staff_shifts;
CREATE POLICY "Users can manage staff_shifts in their business" 
    ON public.staff_shifts FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = staff_shifts.business_id));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_staff_shifts_updated_at ON public.staff_shifts;
CREATE TRIGGER update_staff_shifts_updated_at
    BEFORE UPDATE ON public.staff_shifts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
