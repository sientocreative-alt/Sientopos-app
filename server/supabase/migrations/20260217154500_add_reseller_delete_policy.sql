-- Add missing DELETE policy for resellers table
DROP POLICY IF EXISTS "Allow authenticated users to delete resellers" ON resellers;
CREATE POLICY "Allow authenticated users to delete resellers" ON resellers
    FOR DELETE USING (true);
