-- Create slider_images table
CREATE TABLE IF NOT EXISTS public.slider_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    duration INTEGER DEFAULT 5, -- Ekranda Kalma Süresi (Sn)
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.slider_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own slider images" 
    ON public.slider_images FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = slider_images.business_id));

CREATE POLICY "Users can insert their own slider images" 
    ON public.slider_images FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = slider_images.business_id));

CREATE POLICY "Users can update their own slider images" 
    ON public.slider_images FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = slider_images.business_id));

CREATE POLICY "Users can delete their own slider images" 
    ON public.slider_images FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = slider_images.business_id));
