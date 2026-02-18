-- Seed Sample Data for Personnel Payments

-- CTE to get a valid business_id 
WITH business_data AS (
   SELECT id FROM public.businesses LIMIT 1
),
-- CTE to ensure/get a staff member
staff_data AS (
   INSERT INTO public.staff (business_id, first_name, last_name, staff_role, email, phone, created_at, updated_at)
   SELECT id, 'Mehmet', 'Demir', 'Personel', 'mehmet@example.com', '5559876543', now(), now()
   FROM business_data
   WHERE NOT EXISTS (SELECT 1 FROM public.staff WHERE email = 'mehmet@example.com')
   RETURNING id
),
existing_staff AS (
   SELECT id FROM public.staff WHERE email = 'mehmet@example.com' LIMIT 1
),
final_staff AS (
    SELECT id FROM staff_data
    UNION ALL
    SELECT id FROM existing_staff
    LIMIT 1
)
-- Insert Transactions
INSERT INTO public.staff_transactions (
    business_id, staff_id, transaction_type, category, payment_method, 
    amount, description, transaction_date, created_at, updated_at
)
SELECT 
    b.id, s.id, 'Ödeme', 'Maaş', 'Havale/EFT', 
    15000.00, 'Ocak 2026 Maaş Ödemesi', '2026-02-01'::date, now(), now()
FROM business_data b, final_staff s
UNION ALL
SELECT 
    b.id, s.id, 'Borç', 'Avans', 'Nakit', 
    2000.00, 'Acil nakit ihtiyacı', '2026-02-05'::date, now(), now()
FROM business_data b, final_staff s
UNION ALL
SELECT 
    b.id, s.id, 'Ödeme', 'Yol', 'Nakit', 
    1000.00, 'Şubat Yol Ücreti', '2026-02-08'::date, now(), now()
FROM business_data b, final_staff s;
