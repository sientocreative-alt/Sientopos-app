CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default rows (optional, or let the app handle it)
-- INSERT INTO system_settings (key, value, description) VALUES 
-- ('paytr_merchant_id', '', 'PayTR Mağaza No'),
-- ('paytr_merchant_key', '', 'PayTR Mağaza Anahtarı'),
-- ('paytr_merchant_salt', '', 'PayTR Mağaza Gizli Anahtar'),
-- ('paytr_test_mode', '1', 'PayTR Test Modu (1=Açık, 0=Kapalı)');
