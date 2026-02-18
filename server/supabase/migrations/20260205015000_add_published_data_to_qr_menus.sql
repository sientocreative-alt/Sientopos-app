-- Add published_data column to qr_menus
ALTER TABLE public.qr_menus
ADD COLUMN IF NOT EXISTS published_data JSONB DEFAULT null;
