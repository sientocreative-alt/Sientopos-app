-- Update devices table with new columns
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS activation_code TEXT,
ADD COLUMN IF NOT EXISTS printer_service TEXT,
ADD COLUMN IF NOT EXISTS pos_service TEXT,
ADD COLUMN IF NOT EXISTS appearance_mode TEXT DEFAULT 'Varsayılan',
ADD COLUMN IF NOT EXISTS caller_id_mode TEXT DEFAULT 'Aktif Değil',
ADD COLUMN IF NOT EXISTS default_printer_id TEXT, -- Keeping as text since printers table doesn't exist yet
ADD COLUMN IF NOT EXISTS show_photos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ring_on_new_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_soft_keyboard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS receive_waiter_calls BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ring_on_waiter_call BOOLEAN DEFAULT false;

-- Rename 'platform' to something else or keep it? 
-- The user removed 'Platform' from the form screenshot but it might be useful to keep in DB or maybe 'appearance_mode' replaces it? 
-- The list view still shows 'Platform'. Let's keep existing columns.
