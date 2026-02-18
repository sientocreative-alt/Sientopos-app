ALTER TABLE seating_areas 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Optional: Initialize sort_order based on creation date
WITH sorted_areas AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_rank
  FROM seating_areas
)
UPDATE seating_areas
SET sort_order = sorted_areas.new_rank
FROM sorted_areas
WHERE seating_areas.id = sorted_areas.id;
