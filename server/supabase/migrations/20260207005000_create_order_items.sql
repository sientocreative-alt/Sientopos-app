-- Create order_items table
DROP TABLE IF EXISTS public.order_items CASCADE;
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    table_id UUID NOT NULL REFERENCES tables(id),
    product_id UUID REFERENCES products(id),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    note TEXT,
    modifiers JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'sent', -- pending, sent, cancelled, gift, paid
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see their business order items" ON order_items
    FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = order_items.business_id));

CREATE POLICY "Users can insert order items" ON order_items
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = order_items.business_id));

CREATE POLICY "Users can update order items" ON order_items
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = order_items.business_id));
