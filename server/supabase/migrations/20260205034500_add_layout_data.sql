-- Add layout_data column to seating_areas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_areas' AND column_name = 'layout_data') THEN
        ALTER TABLE seating_areas ADD COLUMN layout_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
