-- Add soft delete columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add soft delete columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Optional: Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_categories_is_deleted ON categories(is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
