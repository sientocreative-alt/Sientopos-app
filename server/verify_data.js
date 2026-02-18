const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking reseller_payout_requests...');

    // Check if table exists by reading it
    const { data, error, count } = await supabase
        .from('reseller_payout_requests')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error:', error.message);
        if (error.code === '42P01') console.log('TABLE DOES NOT EXIST');
    } else {
        console.log(`Table exists. Row count: ${count}`);
        console.log('Sample Data:', JSON.stringify(data.slice(0, 2), null, 2));
    }
}

check();
