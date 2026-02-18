require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
    console.log('Checking subscription_plans columns...');

    // Check columns via information_schema (mocking this via error message usually, but let's try a safe select)
    // Actually Supabase JS client doesn't easily let us query information_schema directly without RPC or raw query support which might be limited.
    // Let's try to select one row and see keys.
    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error.message);
    } else if (data && data.length > 0) {
        console.log('Existing Columns:', Object.keys(data[0]));
    } else {
        console.log('Table exists but is empty. Cannot determine columns via SELECT *. attempting to insert dummy to trigger specific error or success.');
    }
}

checkTable();
