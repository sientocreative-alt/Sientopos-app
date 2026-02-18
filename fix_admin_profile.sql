-- BU SORGUSYU SUPABASE SQL EDITOR'DE ÇALIŞTIRIN --

-- 1. admin@pos.com kullanıcısının ID'sini alıp PROFİL oluşturuyoruz (veya varsa güncelliyoruz)
INSERT INTO public.profiles (id, full_name, role, business_id)
SELECT 
  id, 
  'Admin User', 
  'admin', 
  (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1)
FROM auth.users 
WHERE email = 'admin@pos.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    business_id = (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1);

-- 2. Kontrol için sonucu göster
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@pos.com');
