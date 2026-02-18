-- Create staff_notifications table
CREATE TABLE IF NOT EXISTS public.staff_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'personal', 'shift'
    target_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'draft'
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view staff_notifications in their business" ON public.staff_notifications;
CREATE POLICY "Users can view staff_notifications in their business" 
    ON public.staff_notifications FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = staff_notifications.business_id));

DROP POLICY IF EXISTS "Users can manage staff_notifications in their business" ON public.staff_notifications;
CREATE POLICY "Users can manage staff_notifications in their business" 
    ON public.staff_notifications FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = staff_notifications.business_id));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_staff_notifications_updated_at ON public.staff_notifications;
CREATE TRIGGER update_staff_notifications_updated_at
    BEFORE UPDATE ON public.staff_notifications
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
