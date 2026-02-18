const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables');

    if (error) {
        // Fallback: try to select from a common table just to check access
        const { data: tables, error: tablesError } = await supabase
            .from('pg_catalog.pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');

        if (tablesError) {
            console.error('Error fetching tables:', tablesError.message);
        } else {
            console.log('Tables:', tables.map(t => t.tablename));
        }
    } else {
        console.log('Tables:', data);
    }
}

listTables();
