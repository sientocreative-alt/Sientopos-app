-- Refined pos_settings table and storage policies
-- This script ensures all columns exist and permissions are correctly set.

-- 1. Ensure the table exists with all required columns
CREATE TABLE IF NOT EXISTS public.pos_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Fatura Bilgileri
    billing_type TEXT,
    company_type TEXT,
    full_name TEXT,
    tax_office TEXT,
    tax_number TEXT,
    address TEXT,
    country TEXT DEFAULT 'Türkiye',
    city TEXT,
    district TEXT,
    zip_code TEXT,
    opening_time TEXT DEFAULT '09:00',
    closing_time TEXT DEFAULT '00:00',
    
    -- Localization & Media
    currency TEXT DEFAULT 'TRY',
    language TEXT DEFAULT 'tr',
    logo_url TEXT,
    kiosk_bg_url TEXT,
    
    -- Service Charge
    service_charge_type TEXT DEFAULT 'Sabit Tutar',
    service_charge_amount NUMERIC DEFAULT 0,
    service_charge_auto BOOLEAN DEFAULT false,
    
    -- Footer Messages (Receipt / Kiosk)
    footer_message_1 TEXT,
    footer_message_2 TEXT,
    footer_message_3 TEXT,
    footer_message_4 TEXT,
    
    -- System Flags (JSONB)
    system_flags JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT unique_business_settings_refined UNIQUE (business_id)
);

-- 2. Add columns if they are missing (for existing tables)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_settings' AND column_name='logo_url') THEN
        ALTER TABLE public.pos_settings ADD COLUMN logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_settings' AND column_name='kiosk_bg_url') THEN
        ALTER TABLE public.pos_settings ADD COLUMN kiosk_bg_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_settings' AND column_name='full_name') THEN
        ALTER TABLE public.pos_settings ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_settings' AND column_name='tax_office') THEN
        ALTER TABLE public.pos_settings ADD COLUMN tax_office TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_settings' AND column_name='tax_number') THEN
        ALTER TABLE public.pos_settings ADD COLUMN tax_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_settings' AND column_name='footer_message_1') THEN
        ALTER TABLE public.pos_settings ADD COLUMN footer_message_1 TEXT;
        ALTER TABLE public.pos_settings ADD COLUMN footer_message_2 TEXT;
        ALTER TABLE public.pos_settings ADD COLUMN footer_message_3 TEXT;
        ALTER TABLE public.pos_settings ADD COLUMN footer_message_4 TEXT;
    END IF;
END $$;

-- 3. Enable RLS and setup robust policies
ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pos settings" ON public.pos_settings;
CREATE POLICY "Users can view their own pos settings" 
    ON public.pos_settings FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = pos_settings.business_id));

DROP POLICY IF EXISTS "Users can insert their own pos settings" ON public.pos_settings;
CREATE POLICY "Users can insert their own pos settings" 
    ON public.pos_settings FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = pos_settings.business_id));

DROP POLICY IF EXISTS "Users can update their own pos settings" ON public.pos_settings;
CREATE POLICY "Users can update their own pos settings" 
    ON public.pos_settings FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = pos_settings.business_id));

-- 4. Storage Bucket for business assets
INSERT INTO storage.buckets (id, name, public)
SELECT 'business-assets', 'business-assets', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'business-assets');

-- Robust Storage Policies (Using DO block to avoid conflicts)
DO $$
BEGIN
    -- Public Access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'business-assets');
    END IF;

    -- Authenticated Access (Using separate policies for better compatibility)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'business-assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'business-assets');
    END IF;
END $$;
