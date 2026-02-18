-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Super admins can manage platform settings" ON public.platform_settings
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
        auth.email() = 'tolgacapaci91@gmail.com'
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
        auth.email() = 'tolgacapaci91@gmail.com'
    );

-- Initial Content
INSERT INTO public.platform_settings (key, value)
VALUES ('reseller_contract', '{"content": "1. TARAFLAR\n\nİşbu sözleşme, bir tarafta Siento Yazılım Hizmetleri (Bundan sonra ŞİRKET olarak anılacaktır) ile diğer tarafta bayi başvurusunu gerçekleştiren gerçek veya tüzel kişi (Bundan sonra BAYİ olarak anılacaktır) arasında akdedilmiştir.\n\n2. KONU\n\nSözleşmenin konusu, ŞİRKET tarafından geliştirilen Siento POS yazılımının BAYİ tarafından son kullanıcılara satışı, pazarlanması ve kurulumu süreçlerine ilişkin hak, yükümlülük ve komisyon oranlarının belirlenmesidir.\n\n3. KOMİSYON VE ÖDEMELER\n\nBAYİ, gerçekleştirdiği her satış için belirlenen oranlarda komisyon alma hakkına sahiptir. Komisyon ödemeleri, müşterinin ödemeyi gerçekleştirmesini takip eden ayın son iş gününe kadar BAYİ''nin bildirdiği banka hesabına aktarılır.\n\n4. GİZLİLİK\n\nTaraflar, birbirlerinin ticari sırlarını ve müşteri verilerini gizli tutacağını kabul and taahhüt ederler."}'::jsonb)
ON CONFLICT (key) DO NOTHING;
