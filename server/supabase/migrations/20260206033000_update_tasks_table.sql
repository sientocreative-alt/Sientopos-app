-- Update tasks table with new mandatory toggles and urgent notification field
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS desc_mandatory BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS img_mandatory BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS urgent_notify BOOLEAN DEFAULT FALSE;
