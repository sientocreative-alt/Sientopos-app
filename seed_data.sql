-- 1. İşletme Oluştur
INSERT INTO public.businesses (name) VALUES ('Tolgac Kafe');

-- 2. Admin Kullanıcısını İşletmeye Bağla (public.profiles üzerinden)
-- NOT: 'tolgacapaci91@gmail.com' kullanıcısının zaten Auth kısmında kayıtlı olması gerekir.
INSERT INTO public.profiles (id, full_name, role, business_id)
SELECT 
  id, 
  'Tolga Çapacı', 
  'admin', 
  (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1)
FROM auth.users 
WHERE email = 'tolgacapaci91@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    business_id = (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1);

-- 3. Kategoriler
INSERT INTO public.categories (name, business_id) VALUES 
('İçecekler', (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1)),
('Yemekler', (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1));

-- 4. Ürünler
INSERT INTO public.products (name, price, stock_quantity, category_id, business_id) VALUES 
('Ayran', 15.00, 50, (SELECT id FROM public.categories WHERE name = 'İçecekler' LIMIT 1), (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1)),
('Çay', 10.00, 100, (SELECT id FROM public.categories WHERE name = 'İçecekler' LIMIT 1), (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1)),
('Türk Kahvesi', 40.00, 30, (SELECT id FROM public.categories WHERE name = 'İçecekler' LIMIT 1), (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1)),
('Adana Kebap', 120.00, 20, (SELECT id FROM public.categories WHERE name = 'Yemekler' LIMIT 1), (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1)),
('Lahmacun', 50.00, 50, (SELECT id FROM public.categories WHERE name = 'Yemekler' LIMIT 1), (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1));

-- 5. Test Siparişi
INSERT INTO public.orders (table_number, status, total, business_id, personel_id)
VALUES 
('Masa 1', 'pending', 135.00, (SELECT id FROM public.businesses WHERE name = 'Tolgac Kafe' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'tolgacapaci91@gmail.com'));
