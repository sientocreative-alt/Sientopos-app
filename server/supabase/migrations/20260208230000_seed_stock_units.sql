-- Seed stock units for all businesses
DO $$
DECLARE
    b_rec RECORD;
    v_mg_id UUID;
    v_ml_id UUID;
    v_mm_id UUID;
    v_adet_id UUID;
BEGIN
    FOR b_rec IN SELECT id FROM public.businesses LOOP
        -- Check if units already exist to avoid duplicates if run multiple times
        IF NOT EXISTS (SELECT 1 FROM public.stock_units WHERE business_id = b_rec.id AND name = 'Miligram') THEN
            
            -- Weight (Ağırlık)
            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Miligram', 'mg', 'Ağırlık', 1, NULL)
            RETURNING id INTO v_mg_id;

            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Gram', 'g', 'Ağırlık', 1000, v_mg_id);

            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Kilogram', 'kg', 'Ağırlık', 1000000, v_mg_id);

            -- Volume (Hacim)
            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Mililitre', 'ml', 'Hacim', 1, NULL)
            RETURNING id INTO v_ml_id;

            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Santilitre', 'cl', 'Hacim', 10, v_ml_id);

            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Litre', 'lt', 'Hacim', 1000, v_ml_id);

            -- Length (Uzunluk)
            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Milimetre', 'mm', 'Uzunluk', 1, NULL)
            RETURNING id INTO v_mm_id;

            -- Piece (Parça)
            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Adet', 'adet', 'Parça', 1, NULL)
            RETURNING id INTO v_adet_id;

            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Deste', 'ds', 'Parça', 10, v_adet_id);

            INSERT INTO public.stock_units (business_id, name, short_name, type, ratio, base_unit_id)
            VALUES (b_rec.id, 'Düzine', 'dz', 'Parça', 12, v_adet_id);

        END IF;
    END LOOP;
END $$;
