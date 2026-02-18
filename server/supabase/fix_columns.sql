
-- 1. Rename column if it exists with old name
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='qr_settings' and column_name='social_foursquare')
  THEN
      ALTER TABLE "public"."qr_settings" RENAME COLUMN "social_foursquare" TO "social_google";
  END IF;
END $$;

-- 2. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
