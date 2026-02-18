-- Seed Sample Data for Invoices module

-- CTE to get a valid business_id (using the first one found)
WITH business_data AS (
   SELECT id FROM public.businesses LIMIT 1
),
-- CTE to ensure/get a supplier
supplier_data AS (
   INSERT INTO public.suppliers (business_id, company_name, authorized_person, email, phone, created_at)
   SELECT id, 'Örnek Tedarikçi Ltd. Şti.', 'Ahmet Yılmaz', 'info@ornektedarikci.com', '5551234567', now()
   FROM business_data
   -- Only insert if not exists (simplified check, might duplicate if run multiple times without constraints, but fine for seed)
   WHERE NOT EXISTS (SELECT 1 FROM public.suppliers LIMIT 1)
   RETURNING id
),
existing_supplier AS (
   SELECT id FROM public.suppliers LIMIT 1
),
final_supplier AS (
    SELECT id FROM supplier_data
    UNION ALL
    SELECT id FROM existing_supplier
    LIMIT 1
),
-- CTE to ensure/get a product
product_data AS (
   INSERT INTO public.products (business_id, name, description, price, vat_rate, stock_quantity, created_at)
   SELECT id, 'Coca Cola 330ml', 'Kutu İçecek', 25.00, 20, 100, now()
   FROM business_data
   WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1)
   RETURNING id
),
existing_product AS (
   SELECT id FROM public.products LIMIT 1
),
final_product AS (
    SELECT id FROM product_data
    UNION ALL
    SELECT id FROM existing_product
    LIMIT 1
),
-- Insert Invoice
inserted_invoice AS (
   INSERT INTO public.invoices (
       business_id, invoice_type, record_type, receiver_type, supplier_id, 
       invoice_no, issue_date, payment_date, 
       amount, tax_kdv_amount, total_amount, description, created_at, updated_at
   )
   SELECT 
       b.id, 'Gider Faturası', 'Satın Alma', 'Tedarikçi', s.id,
       'GIB20240001', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days',
       1000.00, 200.00, 1200.00, 'Aylık içecek alımı', now(), now()
   FROM business_data b, final_supplier s
   RETURNING id
)
-- Insert Invoice Items
INSERT INTO public.invoice_items (
    invoice_id, product_id, quantity, unit, unit_price_excl_vat, 
    tax_kdv_rate, tax_kdv_amount, 
    total_amount
)
SELECT 
    i.id, p.id, 40, 'Adet', 25.00, 
    20, 200.00, 
    1200.00
FROM inserted_invoice i, final_product p;
