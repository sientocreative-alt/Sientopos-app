const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const tableName = process.argv[2] || 'orders';
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Columns in ${tableName}:`, data.length > 0 ? Object.keys(data[0]) : 'No data found');
    }
}

inspectSchema();
