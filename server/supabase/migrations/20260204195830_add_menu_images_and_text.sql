ALTER TABLE public.qr_menus 
ADD COLUMN IF NOT EXISTS logo_url text DEFAULT null,
ADD COLUMN IF NOT EXISTS cover_url text DEFAULT null,
ADD COLUMN IF NOT EXISTS title_tr text DEFAULT null,
ADD COLUMN IF NOT EXISTS subtitle_tr text DEFAULT null;
