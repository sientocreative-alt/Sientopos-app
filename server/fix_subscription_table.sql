-- ⚠️ IMPORTANT: This will delete existing plans!
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Re-create the table with correct schema
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10, 2) NOT NULL,
    yearly_price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TL',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert Default Plans
INSERT INTO subscription_plans (name, description, monthly_price, yearly_price, features, is_active)
VALUES 
('Başlangıç Paketi', 'Küçük işletmeler için ideal.', 100.00, 1000.00, '["Sınırsız Masa", "QR Menü", "7/24 Destek"]'::jsonb, true),
('Profesyonel Paket', 'Büyümek isteyen işletmeler için.', 250.00, 2500.00, '["Tüm Özellikler", "Öncelikli Destek", "Yıllık Raporlama", "Stok Takibi"]'::jsonb, true);

-- Re-link subscriptions table if column is missing
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);
