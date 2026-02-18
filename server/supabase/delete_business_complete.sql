CREATE OR REPLACE FUNCTION public.delete_business_complete(p_business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Muhasebe & Faturalar
    DELETE FROM public.invoice_items WHERE invoice_id IN (SELECT id FROM public.invoices WHERE business_id = p_business_id);
    DELETE FROM public.invoices WHERE business_id = p_business_id;
    DELETE FROM public.customer_businesses WHERE business_id = p_business_id;
    
    -- 2. Personel & Mesai
    DELETE FROM public.staff_transactions WHERE staff_id IN (SELECT id FROM public.staff WHERE business_id = p_business_id);
    DELETE FROM public.staff_attendance WHERE staff_id IN (SELECT id FROM public.staff WHERE business_id = p_business_id);
    DELETE FROM public.staff_shifts WHERE staff_id IN (SELECT id FROM public.staff WHERE business_id = p_business_id);
    DELETE FROM public.staff_notifications WHERE business_id = p_business_id;
    DELETE FROM public.targets WHERE business_id = p_business_id;
    DELETE FROM public.staff WHERE business_id = p_business_id;
    DELETE FROM public.staff_roles WHERE business_id = p_business_id;
    DELETE FROM public.staff_break_rules WHERE business_id = p_business_id;

    -- 3. Stok & Depo
    DELETE FROM public.stock_entries WHERE business_id = p_business_id;
    DELETE FROM public.product_recipes WHERE business_id = p_business_id;
    DELETE FROM public.stock_categories WHERE business_id = p_business_id;
    DELETE FROM public.stock_units WHERE business_id = p_business_id;
    DELETE FROM public.warehouses WHERE business_id = p_business_id;
    DELETE FROM public.supplier_transactions WHERE business_id = p_business_id;
    DELETE FROM public.suppliers WHERE business_id = p_business_id;

    -- 4. Menü & Ürünler
    DELETE FROM public.order_items WHERE business_id = p_business_id;
    DELETE FROM public.products WHERE business_id = p_business_id;
    DELETE FROM public.categories WHERE business_id = p_business_id;
    DELETE FROM public.pos_product_types WHERE business_id = p_business_id;

    -- 5. Satış & Ödeme
    DELETE FROM public.payments WHERE business_id = p_business_id;
    DELETE FROM public.orders WHERE business_id = p_business_id;

    -- 6. QR & Müşteri
    DELETE FROM public.feedback_forms WHERE business_id = p_business_id;
    DELETE FROM public.menu_analytics WHERE business_id = p_business_id;
    DELETE FROM public.qr_menus WHERE business_id = p_business_id;
    DELETE FROM public.qr_settings WHERE business_id = p_business_id;
    DELETE FROM public.tables WHERE business_id = p_business_id;
    DELETE FROM public.delivery_customers WHERE business_id = p_business_id;
    DELETE FROM public.customers WHERE business_id = p_business_id;

    -- 7. Kampanyalar & İndirimler
    DELETE FROM public.campaigns WHERE business_id = p_business_id;
    DELETE FROM public.happy_hours WHERE business_id = p_business_id;
    DELETE FROM public.timed_discounts WHERE business_id = p_business_id;
    DELETE FROM public.discount_types WHERE business_id = p_business_id;

    -- 8. Cihazlar & Alanlar
    DELETE FROM public.terminals WHERE business_id = p_business_id;
    DELETE FROM public.printers WHERE business_id = p_business_id;
    DELETE FROM public.devices WHERE business_id = p_business_id;
    DELETE FROM public.seating_areas WHERE business_id = p_business_id;
    DELETE FROM public.table_colors WHERE business_id = p_business_id;
    DELETE FROM public.slider_images WHERE business_id = p_business_id;

    -- 9. Ayarlar & Profil
    -- Silmeden önce kullanıcı ID'lerini topla (Auth temizliği için)
    CREATE TEMP TABLE tmp_deleted_users AS
    SELECT id FROM public.profiles WHERE business_id = p_business_id;

    DELETE FROM public.pos_settings WHERE business_id = p_business_id;
    DELETE FROM public.profiles WHERE business_id = p_business_id;
    DELETE FROM public.predefined_notes WHERE business_id = p_business_id;

    -- 10. İŞLETME SİL
    DELETE FROM public.businesses WHERE id = p_business_id;

    -- 11. AUTH TEMİZLİĞİ ( SECURITY DEFINER olduğu için yetkisi var )
    -- Önce identities, sonra users
    DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM tmp_deleted_users);
    DELETE FROM auth.users WHERE id IN (SELECT id FROM tmp_deleted_users);
    
    DROP TABLE tmp_deleted_users;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
