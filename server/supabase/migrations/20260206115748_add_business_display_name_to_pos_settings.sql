-- Add business_display_name to pos_settings
ALTER TABLE public.pos_settings ADD COLUMN IF NOT EXISTS business_display_name TEXT;
