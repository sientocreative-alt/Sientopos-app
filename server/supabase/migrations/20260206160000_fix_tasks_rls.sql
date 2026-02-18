-- Standardize RLS policies for tasks table
-- Drop old policies (both old auto-generated names and generic names)
DROP POLICY IF EXISTS tasks_select_policy ON tasks;
DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
DROP POLICY IF EXISTS tasks_update_policy ON tasks;
DROP POLICY IF EXISTS tasks_delete_policy ON tasks;
DROP POLICY IF EXISTS "Enable read access for business users" ON tasks;
DROP POLICY IF EXISTS "Enable insert access for business users" ON tasks;
DROP POLICY IF EXISTS "Enable update access for business users" ON tasks;
DROP POLICY IF EXISTS "Enable delete access for business users" ON tasks;

-- Create new policies based on profile lookup with unique names
CREATE POLICY tasks_read_policy ON tasks
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tasks.business_id
    ));

CREATE POLICY tasks_insert_policy ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tasks.business_id
    ));

CREATE POLICY tasks_update_policy ON tasks
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tasks.business_id
    ));

CREATE POLICY tasks_delete_policy ON tasks
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE business_id = tasks.business_id
    ));
