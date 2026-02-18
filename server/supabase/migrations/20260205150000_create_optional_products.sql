-- Create Optional Product Categories Table
CREATE TABLE IF NOT EXISTS optional_product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Optional Products Table
CREATE TABLE IF NOT EXISTS optional_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) NOT NULL,
    category_id UUID REFERENCES optional_product_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stock_product_id UUID REFERENCES products(id), -- Optional link to inventory
    price DECIMAL(10, 2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    unit TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS Policies
ALTER TABLE optional_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE optional_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own optional categories" ON optional_product_categories
    FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_product_categories.business_id));

CREATE POLICY "Users can insert their own optional categories" ON optional_product_categories
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_product_categories.business_id));

CREATE POLICY "Users can update their own optional categories" ON optional_product_categories
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_product_categories.business_id));

CREATE POLICY "Users can delete their own optional categories" ON optional_product_categories
    FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_product_categories.business_id));

CREATE POLICY "Users can view their own optional products" ON optional_products
    FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_products.business_id));

CREATE POLICY "Users can insert their own optional products" ON optional_products
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_products.business_id));

CREATE POLICY "Users can update their own optional products" ON optional_products
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_products.business_id));

CREATE POLICY "Users can delete their own optional products" ON optional_products
    FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE business_id = optional_products.business_id));
