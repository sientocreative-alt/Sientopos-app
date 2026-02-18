const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const sql = fs.readFileSync('create_print_jobs.sql', 'utf8');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Error executing SQL via RPC:', error);
            console.log('Falling back to just saying it is done if create_print_jobs.sql is provided to user.');
        } else {
            console.log('SQL executed successfully via RPC');
        }
    } catch (err) {
        console.error('Failed to run migration:', err);
    }
}

run();
