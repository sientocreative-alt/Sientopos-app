
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using Service Role Key to first test if Logic works
// To test RLS/Permissions properly we'd need a user token, which is hard to generate here without login.
// But valid Service Role execution confirms the function *works*.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('Testing RPC Call...');

    // 1. Get a business ID
    const { data: businesses } = await supabase.from('businesses').select('id').limit(1);
    if (!businesses || businesses.length === 0) {
        console.error('No business found');
        return;
    }
    const businessId = businesses[0].id; // "d0e1..."

    // 2. Prepare Date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    console.log(`Calling get_monthly_paid_items for Business: ${businessId}, Start: ${startOfMonth}`);

    // 3. Call RPC
    const { data, error } = await supabase.rpc('get_business_stats', {
        p_business_id: businessId,
        p_start_date: startOfMonth
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log(`RPC Success! Found ${data?.length} items.`);
        if (data?.length > 0) {
            console.log('Sample Item:', data[0]);
        } else {
            // Double check if standard query finds it (to confirm it SHOULD be there)
            const { count } = await supabase
                .from('order_items')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', businessId)
                .eq('status', 'paid');
            console.log(`Standard query found ${count} paid items. If RPC found 0, something is wrong with RPC logic.`);
        }
    }
}

testRpc();
