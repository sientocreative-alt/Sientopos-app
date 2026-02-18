-- Add contact_email and contact_phone to pos_settings
ALTER TABLE public.pos_settings ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.pos_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
